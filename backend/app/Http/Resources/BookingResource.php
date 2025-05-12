<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'date'          => $this->tableAvailability->date,
            'time'          => $this->reserved_time,
            'room'          => $this->tableAvailability->room,     // NEW
            'customer_name' => $this->full_name,
            'guest_count'   => $this->total_adults + $this->total_kids,
            'details'       => BookingDetailResource::collection($this->whenLoaded('details')),
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
