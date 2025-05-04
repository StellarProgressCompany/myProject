<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use App\Models\ClosedDay;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

/**
 * Table-availability endpoints
 */
class TableAvailabilityController extends Controller
{
    private const CLOSED_INDICATOR  = 'closed';
    private const BLOCKED_INDICATOR = 'blocked';

    private function minutesStep(): int
    {
        $step = Config::get('restaurant.slot_step');
        if ($step === null) {
            throw new \RuntimeException('Missing config: restaurant.slot_step');
        }
        return (int)$step;
    }

    private function serviceSchedule(): array
    {
        return Config::get('restaurant_dataset.service_schedule', []);
    }

    private function buildTimeGrid(string $start, string $end): array
    {
        [$sh,$sm] = array_map('intval', explode(':',$start));
        [$eh,$em] = array_map('intval', explode(':',$end));

        $slots=[];
        for($m=$sh*60+$sm; $m<=$eh*60+$em; $m+=$this->minutesStep()){
            $slots[]=sprintf('%02d:%02d', intdiv($m,60), $m%60);
        }
        return $slots;
    }

    private function computeRoundAvailability($tableAvailabilities, array $roundTimes, $allBookings=null)
    {
        if($allBookings===null){
            $ids=$tableAvailabilities->pluck('id');
            $allBookings=Booking::whereIn('table_availability_id',$ids)->get();
        }

        $caps     = Config::get('restaurant.capacities',[2,4,6]);
        $isSecond = in_array(
            Config::get('restaurant.rounds.lunch.second_round.start'),
            $roundTimes,true
        );

        $availability=[];
        foreach($caps as $cap){
            $taRow  =$tableAvailabilities->firstWhere('capacity',$cap);
            $seeded =$taRow?->available_count ?? 0;
            $booked =$allBookings
                ->where('table_availability_id',$taRow?->id)
                ->filter(function($b) use($roundTimes,$isSecond){
                    if(in_array($b->reserved_time,$roundTimes,true)){
                        return true;
                    }
                    return $isSecond && $b->long_stay && $b->reserved_time < $roundTimes[0];
                })
                ->count();

            $availability["$cap"]=max($seeded-$booked,0);
        }

        return $availability;
    }

    public function index(Request $request)
    {
        $date     = trim($request->query('date',''));
        $mealType = trim($request->query('mealType',''));

        if(!$date || !in_array($mealType,['lunch','dinner'],true)){
            return response()->json([],400);
        }

        // manually closed?
        if(ClosedDay::where('date',$date)->exists()){
            return response()->json(self::CLOSED_INDICATOR);
        }

        // before booking-open-from?
        $openFrom = SystemSetting::getValue('booking_open_from');
        if($openFrom && $date < $openFrom){
            return response()->json(self::BLOCKED_INDICATOR);
        }

        // weekly schedule
        $dow            = Carbon::parse($date)->dayOfWeek;
        $serviceAllowed = in_array($mealType,$this->serviceSchedule()[$dow] ?? [],true);
        if(!$serviceAllowed){
            return response()->json(self::CLOSED_INDICATOR);
        }

        $rows = TableAvailability::where('date',$date)
            ->where('meal_type',$mealType)
            ->get()
            ->keyBy('capacity');

        if($rows->isEmpty()){
            return response()->json([]);
        }

        $roundCfg = Config::get("restaurant.rounds.$mealType");
        $payload  = [];

        foreach($roundCfg as $key=>$def){
            $times         = $this->buildTimeGrid($def['start'],$def['end']);
            $payload[$key] = [
                'time'         =>$def['start'],
                'availability' =>$this->computeRoundAvailability($rows,$times),
                'note'         =>$def['note'],
            ];
        }

        return response()->json($payload);
    }

    public function range(Request $request)
    {
        $start    = $request->query('start');
        $end      = $request->query('end');
        $mealType = $request->query('mealType');

        if(!$start||!$end||!in_array($mealType,['lunch','dinner'],true)){
            return response()->json(['error'=>'Missing parameters (start,end,mealType)'],400);
        }

        $startDate = Carbon::parse($start);
        $endDate   = Carbon::parse($end);
        if($endDate->lt($startDate)){
            return response()->json(['error'=>'end must be after start'],400);
        }

        $rows = TableAvailability::whereBetween('date',[$start,$end])
            ->where('meal_type',$mealType)
            ->get();

        $availabilityIds = $rows->pluck('id');
        $bookings        = Booking::whereIn('table_availability_id',$availabilityIds)->get();

        $roundCfg = Config::get("restaurant.rounds.$mealType");
        $schedule = $this->serviceSchedule();
        $openFrom = SystemSetting::getValue('booking_open_from');
        $results  = [];

        $cursor = $startDate->copy();
        while($cursor->lte($endDate)){
            $dateStr = $cursor->format('Y-m-d');

            if(ClosedDay::where('date',$dateStr)->exists()){
                $results[$dateStr] = self::CLOSED_INDICATOR;
                $cursor->addDay();
                continue;
            }

            if($openFrom && $dateStr < $openFrom){
                $results[$dateStr] = self::BLOCKED_INDICATOR;
                $cursor->addDay();
                continue;
            }

            $dow         = $cursor->dayOfWeek;
            $servedMeals = $schedule[$dow] ?? [];
            if(empty($servedMeals)){
                $results[$dateStr] = self::CLOSED_INDICATOR;
                $cursor->addDay();
                continue;
            }
            if(!in_array($mealType,$servedMeals,true)){
                $results[$dateStr] = [];
                $cursor->addDay();
                continue;
            }

            $dayRows = $rows->where('date',$dateStr);
            if($dayRows->isEmpty()){
                $results[$dateStr] = [];
                $cursor->addDay();
                continue;
            }

            $payload = [];
            foreach($roundCfg as $key=>$def){
                $grid = $this->buildTimeGrid($def['start'],$def['end']);
                $payload[$key] = [
                    'time'         =>$def['start'],
                    'availability'=>$this->computeRoundAvailability($dayRows,$grid,$bookings),
                    'note'        =>$def['note'],
                ];
            }
            $results[$dateStr] = $payload;
            $cursor->addDay();
        }

        return response()->json($results);
    }
}
