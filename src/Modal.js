'use strict';

import core from 'metal';
import dom from 'metal-dom';
import { EventHandler } from 'metal-events';
import templates from './Modal.soy.js';
import Component from 'metal-component';
import Soy from 'metal-soy';

/**
 * Modal component.
 */
class Modal extends Component {
	/**
	 * @inheritDoc
	 */
	created() {
		this.eventHandler_ = new EventHandler();
	}

	/**
	 * @inheritDoc
	 */
	attached() {
		this.autoFocus_(this.autoFocus);
	}

	/**
	 * Automatically focuses the element specified by the given selector.
	 * @param {boolean|string} autoFocusSelector The selector, or false if no
	 *   element should be automatically focused.
	 * @protected
	 */
	autoFocus_(autoFocusSelector) {
		if (this.inDocument && this.visible && autoFocusSelector) {
			var element = this.element.querySelector(autoFocusSelector);
			if (element) {
				element.focus();
			}
		}
	}

	/**
	 * @inheritDoc
	 */
	detached() {
		super.detached();
		this.eventHandler_.removeAllListeners();
	}

	/**
	* Adds a class to the body to disable body scrolling when modal is larger
	* than window height. Allows modal to scroll
	*/
	disableBodyScroll() {
		var body = document.querySelector('body');

		dom.addClasses(body, 'modal-open');
	}

	/**
	 * @inheritDoc
	 */
	disposeInternal() {
		dom.exitDocument(this.overlayElement);
		this.unrestrictFocus_();
		super.disposeInternal();
	}

	/**
	 * Removes the "modal-open" class from the body, enabling it to scroll again
	 */
	enableBodyScroll() {
		var body = document.querySelector('body');

		dom.removeClasses(body, 'modal-open');
	}

	/**
	 * Handles a `focus` event on the document. If the focused element is
	 * outside the modal and an overlay is being used, focuses the modal back.
	 * @param {!Event} event
	 * @protected
	 */
	handleDocumentFocus_(event) {
		if (this.overlay && !this.element.contains(event.target)) {
			this.autoFocus_('.modal-dialog');
		}
	}

	/**
	 * Handles document click in order to close the alert.
	 * @param {!Event} event
	 * @protected
	 */
	handleKeyup_(event) {
		if (event.keyCode === 27) {
			this.hide();
		}
	}

	/**
	 * Hides the modal, setting its `visible` state key to false.
	 */
	hide() {
		this.visible = false;
	}

	/**
	 * Restricts focus to the modal while it's visible.
	 * @protected
	 */
	restrictFocus_() {
		if (!this.restrictFocusHandle_) {
			this.restrictFocusHandle_ = dom.on(document, 'focus', this.handleDocumentFocus_.bind(this), true);
		}
	}

	/**
	 * Shifts the focus back to the last element that had been focused before the
	 * modal was shown.
	 * @protected
	 */
	shiftFocusBack_() {
		if (this.lastFocusedElement_) {
			this.lastFocusedElement_.focus();
			this.lastFocusedElement_ = null;
		}
	}

	/**
	 * Shows the modal, setting its `visible` state key to true.
	 */
	show() {
		this.visible = true;
	}

	/**
	 * Syncs the component according to the value of the `hideOnEscape` state key.
	 * @param {boolean} hideOnEscape
	 */
	syncHideOnEscape(hideOnEscape) {
		if (hideOnEscape) {
			this.eventHandler_.add(dom.on(document, 'keyup', this.handleKeyup_.bind(this)));
		} else {
			this.eventHandler_.removeAllListeners();
		}
	}

	/**
	 * Syncs the component according to the value of the `overlay` state key.
	 * @param {boolean} overlay
	 */
	syncOverlay(overlay) {
		var willShowOverlay = overlay && this.visible;
		dom[willShowOverlay ? 'enterDocument' : 'exitDocument'](this.overlayElement);
	}

	/**
	 * Syncs the component according to the value of the `visible` state key.
	 */
	syncVisible() {
		this.syncOverlay(this.overlay);

		if (this.visible) {
			this.lastFocusedElement_ = this.lastFocusedElement_ || document.activeElement;
			this.autoFocus_(this.autoFocus);
			this.restrictFocus_();
			this.disableBodyScroll();
		} else {
			this.unrestrictFocus_();
			this.shiftFocusBack_();
			this.enableBodyScroll();
		}
	}

	/**
	 * Removes the handler that restricts focus to elements inside the modal.
	 * @protected
	 */
	unrestrictFocus_() {
		if (this.restrictFocusHandle_) {
			this.restrictFocusHandle_.removeListener();
			this.restrictFocusHandle_ = null;
		}
	}

	/**
	 * Defines the default value for the `overlayElement` state key.
	 * @protected
	 */
	valueOverlayElementFn_() {
		return dom.buildFragment('<div class="modal-backdrop fade in"></div>').firstChild;
	}
}

Modal.STATE = {
	/**
	 * A selector for the element that should be automatically focused when the modal
	 * becomes visible, or `false` if no auto focus should happen. Defaults to the
	 * modal's close button.
	 * @type {boolean|string}
	 */
	autoFocus: {
		validator: val => val === false || core.isString(val),
		value: '.close'
	},

	/**
	 * Content to be placed inside modal body. Can be either an html string or
	 * a function that calls incremental dom for rendeirng the body.
	 * @type {string|function()}
	 */
	body: {
	},

	/**
	 * The id used by the body element.
	 * @type {string}
	 */
	bodyId: {
		valueFn: () => 'modal-body-' + core.getUid()
	},

	/**
	 * Content to be placed inside modal footer. Can be either an html string or
	 * a function that calls incremental dom for rendeirng the footer.
	 * @type {string|function()}
	 */
	footer: {
	},

	/**
	 * The id used by the header element.
	 * @type {string}
	 */
	headerId: {
		valueFn: () => 'modal-header-' + core.getUid()
	},

	/**
	 * Content to be placed inside modal header. Can be either an html string or
	 * a function that calls incremental dom for rendeirng the header.
	 * @type {string|function()}
	 */
	header: {
	},

	/**
	 * Whether modal should hide on esc.
	 * @type {boolean}
	 * @default true
	 */
	hideOnEscape: {
		validator: core.isBoolean,
		value: true
	},

	/**
	 * Flag indicating if the default "x" button for closing the modal should be
	 * added or not.
	 * @type {boolean}
	 * @default false
	 */
	noCloseButton: {
		value: false
	},

	/**
	 * Whether overlay should be visible when modal is visible.
	 * @type {boolean}
	 * @default true
	 */
	overlay: {
		validator: core.isBoolean,
		value: true
	},

	/**
	 * Element to be used as overlay.
	 * @type {Element}
	 */
	overlayElement: {
		initOnly: true,
		valueFn: 'valueOverlayElementFn_'
	},

	/**
	 * The ARIA role to be used for this modal.
	 * @type {string}
	 * @default 'dialog'
	 */
	role: {
		validator: core.isString,
		value: 'dialog'
	}
};

Soy.register(Modal, templates);

export default Modal;
