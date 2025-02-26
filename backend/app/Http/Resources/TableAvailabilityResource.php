<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A flexible resource to wrap availability data.
 * Since we're computing availability arrays on-the-fly,
 * this resource can simply return the array structure.
 */
class TableAvailabilityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * Because this resource is sometimes used to return a single-day
     * structure and other times used for a multi-day structure (range),
     * we simply return $this->resource as-is.
     *
     * @param \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        // $this->resource is the array from the controller
        return $this->resource;
    }
}
