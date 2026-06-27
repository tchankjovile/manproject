@echo off
echo === CollabFlow - Setup ===
echo.

echo [1/4] Création du superuser Django...
.\env\Scripts\python.exe manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); U.objects.filter(username='admin').delete(); u=U.objects.create_superuser('admin','admin@collabflow.com','Admin1234!'); u.role='admin'; u.first_name='Admin'; u.last_name='User'; u.save(); print('Superuser cree: admin / Admin1234!')"

echo.
echo [2/4] Installation des dépendances npm...
cd frontend
npm install
cd ..

echo.
echo === Setup terminé ! ===
echo.
echo Pour lancer l'application:
echo   1. Backend  : run_backend.bat
echo   2. Frontend : run_frontend.bat
pause
