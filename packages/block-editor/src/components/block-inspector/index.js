/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockType,
	getUnregisteredTypeHandlerName,
} from '@wordpress/blocks';
import {
	PanelBody,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockCard from '../block-card';
import InspectorControls from '../inspector-controls';
import InspectorAdvancedControls from '../inspector-advanced-controls';
import MultiSelectionInspector from '../multi-selection-inspector';
const BlockInspector = ( {
	blockType,
	count,
	selectedBlockClientId,
	selectedBlockName,
	showNoBlockSelectedMessage = true,
	bubblesVirtually = true,
} ) => {
	if ( count > 1 ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				<InspectorControls.Slot bubblesVirtually={ bubblesVirtually } />
			</div>
		);
	}

	const isSelectedBlockUnregistered =
		selectedBlockName === getUnregisteredTypeHandlerName();

	/*
	 * If the selected block is of an unregistered type, avoid showing it as an actual selection
	 * because we want the user to focus on the unregistered block warning, not block settings.
	 */
	if (
		! blockType ||
		! selectedBlockClientId ||
		isSelectedBlockUnregistered
	) {
		if ( showNoBlockSelectedMessage ) {
			return (
				<span className="block-editor-block-inspector__no-blocks">
					{ __( 'No block selected.' ) }
				</span>
			);
		}
		return null;
	}

	return (
		<div className="block-editor-block-inspector">
			<BlockCard blockType={ blockType } />

			<InspectorControls.Slot bubblesVirtually={ bubblesVirtually } />

			<div>
				<AdvancedControls
					slotName={ InspectorAdvancedControls.slotName }
					bubblesVirtually={ bubblesVirtually }
				/>
			</div>
			<SkipToSelectedBlock key="back" />
		</div>
	);
};

const AdvancedControls = ( { slotName, bubblesVirtually } ) => {
	const slot = useSlot( slotName );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__advanced"
			title={ __( 'Advanced' ) }
			initialOpen={ false }
		>
			<InspectorAdvancedControls.Slot
				bubblesVirtually={ bubblesVirtually }
			/>
		</PanelBody>
	);
};

export default withSelect( ( select ) => {
	const {
		getSelectedBlockClientId,
		getSelectedBlockCount,
		getBlockName,
	} = select( 'core/block-editor' );
	const selectedBlockClientId = getSelectedBlockClientId();
	const selectedBlockName =
		selectedBlockClientId && getBlockName( selectedBlockClientId );
	const blockType =
		selectedBlockClientId && getBlockType( selectedBlockName );
	return {
		count: getSelectedBlockCount(),
		selectedBlockName,
		selectedBlockClientId,
		blockType,
	};
} )( BlockInspector );
