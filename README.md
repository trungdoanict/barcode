# electron-auto-update-example

Example auto-updating Electron app, built with electron-builder. Read [this medium article](https://medium.com/@johndyer24/creating-and-deploying-an-auto-updating-electron-app-for-mac-and-windows-using-electron-builder-6a3982c0cee6) for instructions on how to build and deploy an auto-updating Electron app.
 build css: npx @tailwindcss/cli -i ./public/css/tailwindcssInput.css -o ./public/css/tailwindcss.css --watch

create file dev-app-update.yml
    provider: github
    owner: trungdoanict
    repo: barcode
    token: 

create file electron-builder.yml
    appId: com.barcode.Apliaction
publish:
    provider: github
    token: 
    owner: trungdoanict
    repo: barcode
    releaseType: release