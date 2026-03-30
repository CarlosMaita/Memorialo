<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Memorialo | Bienvenida</title>
        <meta
            name="description"
            content="Bienvenida a Memorialo. Visita la version beta en mockup.memorialo.com."
        >

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />

        <style>
            :root {
                --navy-blue: #0a1f44;
                --gold: #d4af37;
                --copper: #b87333;
                --cream: #f8f3e8;
                --text: #17305d;
                --muted: #5d6985;
            }

            * {
                box-sizing: border-box;
            }

            html,
            body {
                margin: 0;
                min-height: 100%;
                /* overflow: hidden; */
            }

            body {
                min-height: 100vh;
                min-height: 100svh;
                display: grid;
                place-items: center;
                padding: 20px;
                font-family: 'Instrument Sans', sans-serif;
                color: var(--text);
                background:
                    radial-gradient(circle at top left, rgba(212, 175, 55, 0.22), transparent 30%),
                    radial-gradient(circle at 85% 15%, rgba(184, 115, 51, 0.12), transparent 24%),
                    linear-gradient(180deg, #fffdf8 0%, var(--cream) 100%);
            }

            a {
                color: inherit;
                text-decoration: none;
            }

            .card {
                width: min(100%, 720px);
                padding: 40px;
                border-radius: 28px;
                text-align: center;
                background: rgba(255, 255, 255, 0.78);
                border: 1px solid rgba(10, 31, 68, 0.1);
                box-shadow: 0 24px 60px rgba(10, 31, 68, 0.12);
                backdrop-filter: blur(14px);
            }

            .logo {
                width: 72px;
                height: 72px;
                margin: 0 auto 20px;
            }

            .brand {
                margin: 0;
                font-size: 1rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: var(--navy-blue);
            }

            h1 {
                margin: 14px 0 12px;
                font-size: clamp(2rem, 5vw, 3.6rem);
                line-height: 1.05;
                letter-spacing: -0.04em;
                color: var(--navy-blue);
            }

            p {
                margin: 0 auto;
                max-width: 32rem;
                font-size: 1.05rem;
                line-height: 1.7;
                color: var(--muted);
            }

            .actions {
                margin-top: 28px;
                display: grid;
                gap: 12px;
                justify-content: center;
            }

            .button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                min-height: 54px;
                padding: 0 24px;
                border-radius: 18px;
                font-size: 1rem;
                font-weight: 700;
                color: #ffffff;
                background: linear-gradient(135deg, var(--navy-blue) 0%, #17356e 100%);
                box-shadow: 0 18px 36px rgba(10, 31, 68, 0.2);
            }

            .url {
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--navy-blue);
            }

            .d-flex {
                display: flex;

            }
            .gap-2 {
                gap: 32px;
            }
            .gap-4 {
                gap: 64px;
            }

            @media (max-width: 640px) {
                body {
                    padding: 16px;
                }

                .d-flex {
                    flex-direction: column;
                }

                .card {
                    padding: 28px 22px;
                    border-radius: 24px;
                }

                .logo {
                    width: 64px;
                    height: 64px;
                    margin-bottom: 18px;
                }

                p {
                    font-size: 1rem;
                }

                .button {
                    width: 100%;
                }
            }
        </style>
    </head>
    <body class="d-flex gap-4">
        <main class="card">
            <div class="logo" aria-hidden="true">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
                    <defs>
                        <linearGradient id="memorialoLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#d4af37" />
                            <stop offset="100%" stop-color="#b87333" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" rx="16" fill="url(#memorialoLogoGradient)" />
                    <path
                        d="M 20 70 L 20 35 Q 20 25 30 25 L 35 25 L 50 50 L 65 25 L 70 25 Q 80 25 80 35 L 80 70"
                        stroke="#0a1f44"
                        stroke-width="6"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M 50 42 L 52 48 L 58 50 L 52 52 L 50 58 L 48 52 L 42 50 L 48 48 Z"
                        fill="#0a1f44"
                    />
                </svg>
            </div>

            <h1>Bienvenido a Memorialo</h1>
            <p>Conoce nuestra version beta y explora la experiencia en mockup.memorialo.com.</p>

            <div class="actions">
                <a class="button" href="https://mockup.memorialo.com" target="_blank" rel="noreferrer">
                    Ver version beta
                    <span aria-hidden="true">→</span>
                </a>
                <a class="url" href="https://mockup.memorialo.com" target="_blank" rel="noreferrer">mockup.memorialo.com</a>
            </div>
        </main>
        <div class="">
            <form method="POST" action="{{ route('interested-providers.store') }}" class="interest-form" style="margin-top:32px;display:grid;gap:18px;max-width:420px;margin-left:auto;margin-right:auto;">
                @csrf
                <h2 style="margin:0 0 8px;font-size:1.3rem;color:var(--navy-blue);font-weight:700;">¿ Quieres ser de los primeros proveedores en Memorialo?</h2>
                <p style="margin:0 0 10px;font-size:1rem;color:var(--muted);">Déjanos tus datos y sé parte del lanzamiento. Recibirás beneficios de fundador por ser de los primeros, ayúdanos a construir el nuevo marketplace para servicios de eventos en Venezuela.</p>
                <input name="name" type="text" placeholder="Nombre completo" required style="padding:12px;border-radius:8px;border:1px solid #d4af37;font-size:1rem;" />
                <input name="email" type="email" placeholder="Correo electrónico" required style="padding:12px;border-radius:8px;border:1px solid #d4af37;font-size:1rem;" />
                <input name="phone" type="text" placeholder="Teléfono (opcional)" style="padding:12px;border-radius:8px;border:1px solid #d4af37;font-size:1rem;" />
                <textarea name="message" placeholder="¿Por qué te interesa? (opcional)" rows="2" style="padding:12px;border-radius:8px;border:1px solid #d4af37;font-size:1rem;"></textarea>
                <button type="submit" class="button" style="margin-top:8px;">Quiero ser parte</button>
                @if(session('success'))
                    <div style="color:var(--gold);font-weight:600;text-align:center;">{{ session('success') }}</div>
                @endif
            </form>

        </div>
    </body>
</html>
