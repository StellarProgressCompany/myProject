<?php

namespace App\Tenancy;

use Illuminate\Http\Request;
use Spatie\Multitenancy\TenantFinder\TenantFinder;
use App\Models\Tenant;

class SlugTenantFinder implements TenantFinder
{
    public function findForRequest(Request $request): ?Tenant
    {
        $host = $request->getHost();

        // admin.stellarprogress.es/admin/{slug}
        if ($host === 'admin.stellarprogress.es') {
            $slug = $request->segment(2);
        } else {
            // {slug}.stellarprogress.es
            $slug = explode('.', $host)[0];
        }

        return Tenant::where('slug', $slug)->first();
    }
}
