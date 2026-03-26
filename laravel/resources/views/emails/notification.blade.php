<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $title ?? 'Notificacion' }}</title>
</head>
<body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, Helvetica, sans-serif; color:#1f2a44;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e6ebf2;">
          <tr>
            <td style="padding:20px 24px; background:#0a1f44; color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width:52px; vertical-align:middle;">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="44" height="44" aria-hidden="true">
                      <defs>
                        <linearGradient id="mailLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#b87333;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="0" width="100" height="100" rx="16" fill="url(#mailLogoGradient)" />
                      <path d="M 20 70 L 20 35 Q 20 25 30 25 L 35 25 L 50 50 L 65 25 L 70 25 Q 80 25 80 35 L 80 70"
                            stroke="#0a1f44"
                            stroke-width="6"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round" />
                      <path d="M 50 42 L 52 48 L 58 50 L 52 52 L 50 58 L 48 52 L 42 50 L 48 48 Z" fill="#0a1f44" />
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:18px; font-weight:700; letter-spacing:0.2px;">{{ $appName ?? 'Memorialo' }}</div>
                    <div style="font-size:12px; color:#c8d2e5; margin-top:2px;">Notificacion de cuenta</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.25; color:#0a1f44;">{{ $title ?? 'Nueva notificacion' }}</h1>

              @if(!empty($recipientName))
                <p style="margin:0 0 14px; font-size:15px; line-height:1.55; color:#42526e;">
                  Hola {{ $recipientName }},
                </p>
              @endif

              <p style="margin:0; font-size:15px; line-height:1.65; color:#42526e;">
                {!! nl2br(e($bodyText ?? 'Tienes una nueva notificacion en Memorialo.')) !!}
              </p>

              @if(!empty($ctaUrl))
                <div style="margin-top:24px;">
                  <a href="{{ $ctaUrl }}"
                     style="display:inline-block; background:linear-gradient(135deg, #d4af37, #b87333); color:#0a1f44; text-decoration:none; font-weight:700; font-size:14px; padding:11px 18px; border-radius:8px;">
                    Ir a Memorialo
                  </a>
                </div>
              @endif
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px; border-top:1px solid #e6ebf2; background:#fafbfd; font-size:12px; color:#6b778c;">
              Este es un correo automatico de {{ $appName ?? 'Memorialo' }}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
