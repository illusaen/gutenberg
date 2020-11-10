/**
 * External dependencies
 */
const fs = require( 'fs' );
const root = process.env.GITHUB_WORKSPACE || '../../../';
const SCREENSHOTS_PATH = root + '/screenshots';

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
	jasmine.getEnv().addReporter( {
		specDone: async ( result ) => {
			if ( result.status === 'failed' ) {
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
	return page.screenshot( { path } );
}
