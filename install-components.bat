@echo off
echo Installing missing shadcn/ui components...

:: Using npx shadcn to add/update components
call npx shadcn add separator --yes
call npx shadcn add badge --yes
call npx shadcn add button --yes
call npx shadcn add card --yes
call npx shadcn add toast --yes
call npx shadcn add tabs --yes
call npx shadcn add label --yes
call npx shadcn add slider --yes
call npx shadcn add input --yes
call npx shadcn add switch --yes
call npx shadcn add sonner --yes
call npx shadcn add alert --yes

echo Installation complete!
