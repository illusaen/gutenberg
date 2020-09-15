/**
 * External dependencies
 */
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getBlockDOMNode } from '../../utils/dom';

/**
 * Scrolls the multi block selection end into view if not in view already. This
 * is important to do after selection by keyboard.
 */
export default function MultiSelectScrollIntoView() {
	const selector = ( select ) => {
		const {
			getBlockSelectionEnd,
			hasMultiSelection,
			isMultiSelecting,
		} = select( 'core/block-editor' );

		return {
			selectionEnd: getBlockSelectionEnd(),
			isMultiSelection: hasMultiSelection(),
			isMultiSelecting: isMultiSelecting(),
		};
	};
	const { isMultiSelection, selectionEnd, isMultiSelecting } = useSelect(
		selector,
		[]
	);
	const ref = useRef();

	useEffect( () => {
		if ( ! selectionEnd || isMultiSelecting || ! isMultiSelection ) {
			return;
		}

		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;
		const extentNode = getBlockDOMNode( selectionEnd, ownerDocument );

		if ( ! extentNode ) {
			return;
		}

		scrollIntoView( extentNode, defaultView, {
			onlyScrollIfNeeded: true,
		} );
	}, [ isMultiSelection, selectionEnd, isMultiSelecting ] );

	return <div ref={ ref } />;
}
