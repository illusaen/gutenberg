/**
 * External dependencies
 */
const fs = require( 'fs' );
const SCREENSHOTS_PATH = __dirname + '/../../../screenshots';

if ( ! fs.existsSync( SCREENSHOTS_PATH ) ) {
	fs.mkdirSync( SCREENSHOTS_PATH );
}

/**
 * @copyright Tom Esterez (@testerez) https://github.com/smooth-code/jest-puppeteer/issues/131#issuecomment-424073620
 */
export const registerScreenshotReporter = () => {
	/**
	 * jasmine reporter does not support async.
	 * So we store the screenshot promise and wait for it before each test
	 */
	let screenshotPromise = Promise.resolve();
	beforeEach( () => screenshotPromise );
	afterAll( () => screenshotPromise );

	/**
	 * Take a screenshot on Failed test.
	 * Jest standard reporters run in a separate process so they don't have
	 * access to the page instance. Using jasmine reporter allows us to
	 * have access to the test result, test name and page instance at the same time.
	 */
	process.stdout.write( 'Registering a reporter' );
	process.stderr.write( 'Registering a reporter' );

	console.error( 'Registering a reporter' );
	jasmine.getEnv().addReporter( {
		specDone: async ( result ) => {
			process.stdout.write( 'Test results: ' + JSON.stringify( result ) );
			process.stderr.write( 'Test results: ' + JSON.stringify( result ) );

			console.error( 'Test results: ' + JSON.stringify( result ) );
			if ( result.status === 'failed' ) {
				process.stdout.write(
					'Taking a screenshot of ' + result.fullName
				);
				process.stderr.write(
					'Taking a screenshot of ' + result.fullName
				);
				console.error( 'Taking a screenshot of ' + result.fullName );
				screenshotPromise = screenshotPromise
					.catch()
					.then( () => takeScreenshot( result.fullName ) );
			}
		},
	} );
};

registerScreenshotReporter();

function takeScreenshot( testName ) {
	const datetime = new Date().toISOString().split( '.' )[ 0 ];
	const readableName = `${ testName } ${ datetime }`;
	const slug = readableName
		.toLowerCase()
		.replace( /:/g, '-' )
		.replace( /[^0-9a-zA-Z \-\(\)]/g, '' )
		.replace( / /g, '-' );

	const path = `${ SCREENSHOTS_PATH }/${ slug }.jpg`;
	console.log( 'takeScreenshot called ' + path );
	return page.screenshot( { path } );
}
