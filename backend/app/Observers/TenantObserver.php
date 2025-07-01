<?php

namespace App\Observers;

use App\Models\Tenant;
use App\Jobs\ProvisionTenant;

class TenantObserver
{
    /**
     * Handle the Tenant "created" event.
     */
    public function created(Tenant $tenant): void
    {
        // queue the provisioning job as soon as a tenant is created
        ProvisionTenant::dispatch($tenant);
    }
}
