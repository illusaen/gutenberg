/**
 * Clicks the default block appender.
 */
export async function clickBlockAppender() {
	const frame = await page
		.frames()
		.find( ( f ) => f.name() === 'editor-content' );
	const appender = await frame.waitForSelector(
		'.block-editor-default-block-appender__content'
	);
	await appender.click();
}
