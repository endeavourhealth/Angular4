import {Component, Input} from '@angular/core';

import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'ngbd-modal-content',
	template: `<div class="modal-header">
		<h4 class="modal-title">{{ title }}</h4>
		<button type="button" class="close" (click)="cancel()" aria-hidden="true">&times;</button>
	</div>
	<div class="modal-body">
		<form endUserRole="form" class="container-fluid">
			<!-- Search -->
			<div class="row">
				<div class="form-group col-md-12">
					<label class="control-label">{{ message }}</label>
					<textarea
						type="text" class="form-control" autofocus
						placeholder="{{ resultData}}"
						[(ngModel)]="resultData"
						(keyup.enter)="ok()"
						(keyup.escape)="cancel()"
						name="resultData"
						[rows]="rows"></textarea>
				</div>
			</div>
		</form>
	</div>
	<div class="modal-footer">
		<button *ngIf="okText" type="button" class="btn btn-primary" (click)="ok()">{{okText}}</button>
		<button *ngIf="cancelText" type="button" class="btn" (click)="cancel()">{{cancelText}}</button>
	</div>

	`
})

export class InputBoxMultiLineDialog {
	@Input() title : string;
	@Input() message : string;
	@Input() resultData : any;
	@Input() okText: string;
	@Input() cancelText: string;
	@Input() rows: number;

	constructor(public activeModal: NgbActiveModal) {}

	public static open(modalService: NgbModal,
										 title : string,
										 message : string,
										 value : string,
										 okText: string,
										 cancelText: string,
										 rows: number = 5) : NgbModalRef {
		const modalRef = modalService.open(InputBoxMultiLineDialog, { backdrop : "static" });
		modalRef.componentInstance.title = title;
		modalRef.componentInstance.message = message;
		modalRef.componentInstance.resultData = value;
		modalRef.componentInstance.okText = okText;
		modalRef.componentInstance.cancelText = cancelText;
		modalRef.componentInstance.rows = rows;

		return modalRef;
	}

	ok() {
		this.activeModal.close(this.resultData);
		console.log('OK Pressed');
	}

	cancel() {
		this.activeModal.dismiss('cancel');
		console.log('Cancel Pressed');
	}
}
