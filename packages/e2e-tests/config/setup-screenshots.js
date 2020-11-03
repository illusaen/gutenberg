/**
 * External dependencies
 */
const fs = require( 'fs' );
const SCREENSHOTS_PATH = __dirname + '/../../../screenshots';

// Inspired by @dennismphil https://github.com/smooth-code/jest-puppeteer/issues/131#issuecomment-605739007

if ( ! fs.existsSync( SCREENSHOTS_PATH ) ) {
	fs.mkdirSync( SCREENSHOTS_PATH );
}
console.log( SCREENSHOTS_PATH );
const wrappedTest = ( test, description ) => {
	return Promise.resolve()
		.then( test )
		.catch( async ( err ) => {
			// Assuming you have a method to take a screenshot
			const filename = description
				.toLowerCase()
				.replace( /[^0-9a-zA-Z \-\(\)]/g, '' )
				.replace( / /g, '-' );
			await page.screenshot( {
				path: SCREENSHOTS_PATH + `/${ filename }.jpg`,
			} );
			console.log(
				'took screen',
				SCREENSHOTS_PATH + `/${ filename }.jpg`
			);

			throw err;
		} );
};

// Make a copy of the original function
const originalIt = global.it;

// Modify `it` to use the wrapped test method
global.it = function it( description, test, timeout ) {
	// Pass on the context by using `call` instead of directly invoking the method.
	return originalIt.call(
		this,
		description,
		wrappedTest.bind( this, test, description ),
		timeout
	);
};

// Copy other function properties like `skip`, `only`...
for ( const prop in originalIt ) {
	if ( Object.prototype.hasOwnProperty.call( originalIt, prop ) ) {
		global.it[ prop ] = originalIt[ prop ];
	}
}

// Monkey patch the `only` method also to use the wrapper method
global.it.only = function only( description, test, timeout ) {
	return originalIt.only.call(
		this,
		description,
		wrappedTest.bind( this, test, description ),
		timeout
	);
};
