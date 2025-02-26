<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BookingDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id'                     => $this->id,
            'capacity'              => $this->capacity,
            'extra_chair'           => (bool) $this->extra_chair,
            'table_availability_id' => $this->table_availability_id,
            // Optional: You could nest further details about TableAvailability here.
            'table_availability'    => $this->whenLoaded('tableAvailability', [
                'date'       => $this->tableAvailability->date,
                'meal_type'  => $this->tableAvailability->meal_type,
                'capacity'   => $this->tableAvailability->capacity,
            ]),
        ];
    }
}
