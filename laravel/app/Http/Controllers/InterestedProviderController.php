<?php

namespace App\Http\Controllers;

use App\Models\InterestedProvider;
use Illuminate\Http\Request;

class InterestedProviderController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:40',
            'message' => 'nullable|string|max:1000',
        ]);

        InterestedProvider::create($validated);

        return redirect()->back()->with('success', '¡Gracias por tu interés! Pronto recibirás novedades exclusivas.');
    }
}
