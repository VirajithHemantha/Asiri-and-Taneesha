1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/18jXSMaRp2u2fWImHvis6Ja2DcF410GxXjvTHrA_WYeE/edit
2. Open Extensions > Apps Script.
3. Replace the script content with the code from google-apps-script/code.gs and save.
4. Select the function `setup` in the toolbar and click Run. Approve the permission prompt.
   This creates the two tabs, RSVP and Wishes, with their headers. (They are also created
   automatically on the first submission if you skip this step.)
5. Click Deploy > New deployment.
6. Select type: Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Deploy and copy the Web App URL (it ends with /exec).
10. Paste that URL into `scriptUrl` at the top of src/lib/googleSheets.ts.

Notes:
- If you update the Apps Script code later, use Deploy > Manage deployments > Edit > Version: New version,
  so the URL stays the same.
- The site sends RSVPs to the RSVP tab and wishes to the Wishes tab, and reads the Wishes tab
  to show the guestbook.
