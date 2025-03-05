<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
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
            'id'            => $this->id,
            'date'          => $this->date,
            'time'          => $this->time,
            'customer_name' => $this->customer_name,
            'guest_count'   => $this->guest_count,
            'details'       => BookingDetailResource::collection($this->whenLoaded('details')),
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
