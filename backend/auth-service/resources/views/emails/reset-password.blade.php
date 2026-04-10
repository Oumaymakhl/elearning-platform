<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#e8f0fb;padding:2rem;">
  <div style="max-width:500px;margin:auto;background:white;border-radius:16px;padding:2rem;box-shadow:0 4px 20px rgba(30,58,95,.1)">
    <h2 style="color:#1E3A5F;text-align:center">🎓 E-Learning</h2>
    <p>Bonjour <strong>{{ $user->name }}</strong>,</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
    <div style="text-align:center;margin:2rem 0">
      <a href="{{ $url }}" style="background:#4A90D9;color:white;padding:.85rem 2rem;border-radius:10px;text-decoration:none;font-weight:600">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="color:#64748b;font-size:.85rem">Ce lien expire dans 60 minutes. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
  </div>
</body>
</html>
