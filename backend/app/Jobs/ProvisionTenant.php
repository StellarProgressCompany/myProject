<?php

namespace App\Jobs;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Spatie\Multitenancy\Jobs\MigrateTenant;

class ProvisionTenant implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Tenant $tenant) {}

    public function handle(): void
    {
        /* --------------------------------------------------------
         * 1) Create the **physical** database if it doesn’t exist
         * ------------------------------------------------------ */
        $dbName = 'tenant_' . $this->tenant->slug;
        DB::connection('mysql')->statement(
            "CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        /* --------------------------------------------------------
         * 2) Point the “tenant” connection to that schema
         * ------------------------------------------------------ */
        $this->tenant->makeCurrent();      // uses MakeTenantCurrentAction

        /* --------------------------------------------------------
         * 3) Run tenant migrations synchronously
         * ------------------------------------------------------ */
        $this->dispatchSync(
            new MigrateTenant($this->tenant)
        );

        /* --------------------------------------------------------
         * 4) Seed the first admin user *inside* the tenant DB
         * ------------------------------------------------------ */
        User::create([
            'name'     => $this->tenant->admin_name,
            'email'    => $this->tenant->admin_email,
            'password' => bcrypt($this->tenant->admin_password),
            'is_admin' => true,
        ]);

        /* --------------------------------------------------------
         * 5) (Optional) add the sub-domain on Forge
         * ------------------------------------------------------ */
        if (
            config('services.forge.token')     &&
            config('services.forge.server_id') &&
            config('services.forge.site_id')
        ) {
            Http::withToken(config('services.forge.token'))->post(
                "https://forge.laravel.com/api/v1/servers/"
                .config('services.forge.server_id')
                ."/sites/".config('services.forge.site_id')."/domain",
                ['domain' => "{$this->tenant->slug}.stellarprogress.es"]
            );
        }
    }
}
