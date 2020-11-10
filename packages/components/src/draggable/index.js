/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { withSafeTimeout } from '@wordpress/compose';

const dragImageClass = 'components-draggable__invisible-drag-image';
const cloneWrapperClass = 'components-draggable__clone';
const cloneHeightTransformationBreakpoint = 700;
const clonePadding = 0;

class Draggable extends Component {
	constructor() {
		super( ...arguments );

		this.onDragStart = this.onDragStart.bind( this );
		this.onDragOver = this.onDragOver.bind( this );
		this.onDragEnd = this.onDragEnd.bind( this );
		this.resetDragState = this.resetDragState.bind( this );
		this.dragComponentRef = createRef();
	}

	componentWillUnmount() {
		this.resetDragState();
	}

	/**
	 * Removes the element clone, resets cursor, and removes drag listener.
	 *
	 * @param  {Object} event The non-custom DragEvent.
	 */
	onDragEnd( event ) {
		const { onDragEnd = noop } = this.props;
		event.preventDefault();

		this.resetDragState();

		// Allow the Synthetic Event to be accessed from asynchronous code.
		// https://reactjs.org/docs/events.html#event-pooling
		event.persist();
		this.props.setTimeout( onDragEnd.bind( this, event ) );
	}

	/**
	 * Updates positioning of element clone based on mouse movement during dragging.
	 *
	 * @param  {Object} event The non-custom DragEvent.
	 */
	onDragOver( event ) {
		this.cloneWrapper.style.top = `${
			parseInt( this.cloneWrapper.style.top, 10 ) +
			event.clientY -
			this.cursorTop
		}px`;
		this.cloneWrapper.style.left = `${
			parseInt( this.cloneWrapper.style.left, 10 ) +
			event.clientX -
			this.cursorLeft
		}px`;

		// Update cursor coordinates.
		this.cursorLeft = event.clientX;
		this.cursorTop = event.clientY;

		const { onDragOver = noop } = this.props;

		// The `event` from `onDragOver` is not a SyntheticEvent
		// and so it doesn't require `event.persist()`.
		this.props.setTimeout( onDragOver.bind( this, event ) );
	}

	/**
	 * This method does a couple of things:
	 *
	 * - Clones the current element and spawns clone over original element.
	 * - Adds a fake temporary drag image to avoid browser defaults.
	 * - Sets transfer data.
	 * - Adds dragover listener.
	 *
	 * @param  {Object} event The non-custom DragEvent.
	 */
	onDragStart( event ) {
		const {
			cloneClassname,
			elementId,
			element = document.getElementById( elementId ),
			transferData,
			onDragStart = noop,
		} = this.props;
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;

		defaultView.focus();

		// Set a fake drag image to avoid browser defaults. Remove from DOM
		// right after. event.dataTransfer.setDragImage is not supported yet in
		// IE, we need to check for its existence first.
		if ( 'function' === typeof event.dataTransfer.setDragImage ) {
			const dragImage = ownerDocument.createElement( 'div' );
			dragImage.id = `drag-image-${ elementId }`;
			dragImage.classList.add( dragImageClass );
			ownerDocument.body.appendChild( dragImage );
			event.dataTransfer.setDragImage( dragImage, 0, 0 );
			this.props.setTimeout( () => {
				ownerDocument.body.removeChild( dragImage );
			} );
		}

		event.dataTransfer.setData( 'text', JSON.stringify( transferData ) );

		// If a dragComponent is defined, the following logic will clone the
		// HTML node and inject it into the cloneWrapper.
		if ( this.dragComponentRef.current ) {
			const {
				ownerDocument: dragComponentDocument,
			} = this.dragComponentRef.current;

			this.cloneWrapper = dragComponentDocument.createElement( 'div' );
			this.cloneWrapper.classList.add( cloneWrapperClass );

			// Position dragComponent at the same position as the cursor.
			this.cloneWrapper.style.top = `${ event.clientY }px`;
			this.cloneWrapper.style.left = `${ event.clientX }px`;

			const clonedDragComponent = dragComponentDocument.createElement(
				'div'
			);
			clonedDragComponent.innerHTML = this.dragComponentRef.current.innerHTML;
			this.cloneWrapper.appendChild( clonedDragComponent );

			// Inject the cloneWrapper into the DOM.
			dragComponentDocument.body.appendChild( this.cloneWrapper );
		} else {
			// Prepare element clone and append to element wrapper.
			const elementRect = element.getBoundingClientRect();
			const elementWrapper = element.parentNode;
			const elementTopOffset = parseInt( elementRect.top, 10 );
			const elementLeftOffset = parseInt( elementRect.left, 10 );

			this.cloneWrapper = ownerDocument.createElement( 'div' );
			this.cloneWrapper.classList.add( cloneWrapperClass );

			if ( cloneClassname ) {
				this.cloneWrapper.classList.add( cloneClassname );
			}

			this.cloneWrapper.style.width = `${
				elementRect.width + clonePadding * 2
			}px`;

			const clone = element.cloneNode( true );
			clone.id = `clone-${ elementId }`;

			if ( elementRect.height > cloneHeightTransformationBreakpoint ) {
				// Scale down clone if original element is larger than 700px.
				this.cloneWrapper.style.transform = 'scale(0.5)';
				this.cloneWrapper.style.transformOrigin = 'top left';
				// Position clone near the cursor.
				this.cloneWrapper.style.top = `${ event.clientY - 100 }px`;
				this.cloneWrapper.style.left = `${ event.clientX }px`;
			} else {
				// Position clone right over the original element (20px padding).
				this.cloneWrapper.style.top = `${
					elementTopOffset - clonePadding
				}px`;
				this.cloneWrapper.style.left = `${
					elementLeftOffset - clonePadding
				}px`;
			}

			// Hack: Remove iFrames as it's causing the embeds drag clone to freeze
			Array.from(
				clone.querySelectorAll( 'iframe' )
			).forEach( ( child ) => child.parentNode.removeChild( child ) );

			this.cloneWrapper.appendChild( clone );

			// Inject the cloneWrapper into the DOM.
			elementWrapper.appendChild( this.cloneWrapper );
		}

		let bufferX = 0;
		let bufferY = 0;

		if ( defaultView.frameElement ) {
			const bufferRect = defaultView.frameElement.getBoundingClientRect();
			bufferX = bufferRect.left;
			bufferY = bufferRect.top;
		}

		// Mark the current cursor coordinates.
		this.cursorLeft = event.clientX - bufferX;
		this.cursorTop = event.clientY - bufferY;

		// Update cursor to 'grabbing', document wide.
		ownerDocument.body.classList.add( 'is-dragging-components-draggable' );
		ownerDocument.addEventListener( 'dragover', this.onDragOver );

		// Allow the Synthetic Event to be accessed from asynchronous code.
		// https://reactjs.org/docs/events.html#event-pooling
		event.persist();
		this.props.setTimeout( onDragStart.bind( this, event ) );
	}

	/**
	 * Cleans up drag state when drag has completed, or component unmounts
	 * while dragging.
	 */
	resetDragState() {
		const {
			elementId,
			element = document.getElementById( elementId ),
		} = this.props;
		const { ownerDocument } = element;

		// Remove drag clone
		ownerDocument.removeEventListener( 'dragover', this.onDragOver );
		if ( this.cloneWrapper && this.cloneWrapper.parentNode ) {
			this.cloneWrapper.parentNode.removeChild( this.cloneWrapper );
			this.cloneWrapper = null;
		}

		this.cursorLeft = null;
		this.cursorTop = null;

		// Reset cursor.
		ownerDocument.body.classList.remove(
			'is-dragging-components-draggable'
		);
	}

	render() {
		const {
			children,
			__experimentalDragComponent: dragComponent,
		} = this.props;

		return (
			<>
				{ children( {
					onDraggableStart: this.onDragStart,
					onDraggableEnd: this.onDragEnd,
				} ) }
				{ dragComponent && (
					<div
						className="components-draggable-drag-component-root"
						style={ { display: 'none' } }
						ref={ this.dragComponentRef }
					>
						{ dragComponent }
					</div>
				) }
			</>
		);
	}
}

export default withSafeTimeout( Draggable );
