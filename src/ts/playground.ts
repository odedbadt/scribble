import { BehaviorSubject } from 'rxjs';
import { withLatestFrom, map } from 'rxjs/operators';
import { google } from 'googleapis';

// Initial observables
const obsA$ = new BehaviorSubject<number>(1);
const obsB$ = new BehaviorSubject<number>(10);

obsA$.pipe(
  withLatestFrom(obsB$),
  map(([a, b]) => b * 2) // Calculate A based on latest B
).subscribe(value => obsA$.next(value));

obsB$.pipe(
  withLatestFrom(obsA$),
  map(([b, a]) => a + 5) // Calculate B based on latest A
).subscribe(value => obsB$.next(value));


const CLIENT_ID = '983437923698-shfpf6udie0o0akgoa3caj7bdvonkhvo.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:8080/';
const REFRESH_TOKEN = 'your-refresh-token';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

// async function listFiles() {
//   const res = await drive.files.list({
//     pageSize: 10,
//     fields: 'files(id, name)',
//   });
//   console.log('Files:');
//   res.data.files.forEach((file) => {
//     console.log(`${file.name} (${file.id})`);
//   });
// }

// listFiles().catch(console.error);
