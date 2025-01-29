// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  //endpoint: 'http://207.180.198.237:8008/appserver/api' //production url for 207.180.198.237:8004 (IN USE)
  // endpoint:'http://207.180.198.237:8008/api'
  // endpoint: 'http://173.212.228.223:8001/api'  //NEW SERVER URL (NOT USED EVER)
  //endpoint: 'https://staff.opallius.com/appserver/api' //production url as on 05-04-2021
  //endpoint: 'https://staging.opallius.com/appserver/api' //staging url as on 13-10-2021
  endpoint: 'https://api.opallius.com/api'  // production server 16-8-23
     // staging url 16-8-23
  // endpoint:'http://127.0.0.1:8000/api'
  //test comment

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.

 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
