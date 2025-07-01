<?php
// app/Actions/MakeTenantCurrentAction.php

namespace App\Actions;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Spatie\Multitenancy\Actions\MakeTenantCurrentAction as BaseAction;
use Spatie\Multitenancy\Models\Tenant;

class MakeTenantCurrentAction extends BaseAction
{
    /** @param Tenant $tenant */
    public function execute($tenant): void
    {
        parent::execute($tenant);

        // every tenant DB is named: tenant_{slug}
        $dbName = 'tenant_' . $tenant->slug;

        Config::set('database.connections.tenant.database', $dbName);

        // reset the connection so the new DB is used
        DB::purge('tenant');
        DB::reconnect('tenant');
    }
}
