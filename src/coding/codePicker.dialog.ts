import {CodeSetValue} from "./models/CodeSetValue";
import {ExclusionTreeNode} from "./models/ExclusionTreeNode";
import {Input, Component, OnInit, ElementRef, ViewChild} from '@angular/core';
import {NgbModal, NgbActiveModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {ITreeOptions} from "angular-tree-component";
import {CodingService} from "./coding.service";
import {LoggerService} from "../logger/logger.service";

@Component({
	selector: 'ngbd-modal-content',
	template: `<div class="modal-header">
		<h4 class="modal-title">Code picker</h4>
		<button type="button" class="close" (click)="cancel()" aria-hidden="true">&times;</button>
	</div>
	<div class="modal-body">
		<form endUserRole="form" class="container-fluid">
			<!-- Search -->
			<div class="row">
				<div class="form-group col-md-4"></div>
				<div class="form-group col-md-4">
					<label class="control-label">Search criteria</label>
					<div class="input-group">
						<input type="text" class="form-control" placeholder="Search term" aria-describedby="searchTerm"
									 [(ngModel)]="searchData" (keyup)="$event.keyCode == 13 && search()" autofocus name="searchData">
						<span class="input-group-append" (click)="search()" style="cursor: pointer">
						<i class="fa fa-search input-group-text" id="searchTerm" aria-hidden="true"></i>
					</span>
					</div>
				</div>
				<div class="form-group col-md-4"></div>
			</div>

			<!-- Matches -->
			<div class="row" #container style="overflow: hidden">
				<div class="col-md-12">
					<label class="control-label">Location:&nbsp;</label><span *ngFor="let item of breadcrumbs"><a href="javascript:;" (click)="navigateConcept(item, true, 5)">{{item.term}}</a> / </span>
				</div>
				<div class="form-group col-md-4">
					<label class="control-label">Parents</label> <small class="text-muted">(Double-click to navigate up)</small>
					<div [ngStyle]="animStyle" class="scroll-box-150 form-control">
						<div *ngFor="let parent of parents"
								 (dblclick)="navigateConcept(parent, true, 1)"
								 class="hover-box show-child-on-hover striped"
								 [ngClass]="{'previous-selection': parent?.code == previousSelection?.code}">
							{{ getTerm(parent) }}
							<button type="button" class="btn btn-xs btn-success pull-right" (click)="addToSelection(parent)" *ngIf="!singleCode">
								<span class="fa fa-sm fa-plus"></span>
							</button>
						</div>
					</div>
				</div>
				<div class="form-group col-md-4">
					<label class="control-label">Codes</label>
					<div [ngStyle]="animStyle" class="scroll-box-150 form-control">
						<div *ngFor="let match of searchResults"
								 (click)="displayCode(match, false)"
								 class="hover-box show-child-on-hover striped"
								 [ngClass]="{'selection': match?.code == highlightedMatch?.code}">
							{{ getTerm(match) }}
							<button type="button" class="btn btn-xs btn-success pull-right child-to-show" (click)="addToSelection(match)" *ngIf="!singleCode">
								<span class="fa fa-sm fa-plus"></span>
							</button>
						</div>
					</div>
				</div>
				<div class="form-group col-md-4">
					<label class="control-label">Children</label> <small class="text-muted">(Double-click to navigate down)</small>
					<div [ngStyle]="animStyle" class="scroll-box-150 form-control">
						<div *ngFor="let child of children"
								 (dblclick)="navigateConcept(child, true, -1)"
								 class="hover-box show-child-on-hover striped"
								 [ngClass]="{'previous-selection': child?.code == previousSelection?.code}">
							{{ getTerm(child) }}
							<button type="button" class="btn btn-xs btn-success pull-right child-to-show" (click)="addToSelection(child)" *ngIf="!singleCode">
								<span class="fa fa-sm fa-plus"></span>
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Selection -->
			<div class="row" [hidden]="singleCode">
				<div class="form-group col-md-6">
					<label class="control-label">Selected codes</label>
					<div class="scroll-box-150 form-control">
						<div *ngFor="let selection of resultData"
								 (click)="displayExclusionTree(selection)"
								 class="hover-box show-child-on-hover striped"
								 [ngClass]="{'selection': selection == highlightedSelection}">
							{{ getTerm(selection) }}
							<span class="label label-success" *ngIf="selection.includeChildren && (!selection.exclusion || selection.exclusion.length == 0)">All children</span>
							<span class="label label-warning" *ngIf="selection.includeChildren && (selection.exclusion && selection.exclusion.length > 0)">Some children</span>
							<span class="label label-danger" *ngIf="!selection.includeChildren">No children</span>
							<button type="button" class="btn btn-xs btn-danger pull-right child-to-show" (click)="removeFromSelection(selection)">
								<span class="fa fa-sm fa-minus"></span>
							</button>
						</div>
					</div>
				</div>
				<div class="form-group col-md-6">
					<label class="control-label">Inclusions/Exclusions</label>
					<div class="scroll-box-150 form-control">

						<tree-root [nodes]="exclusionTreeData" [options]="options">
							<ng-template #treeNodeTemplate let-node>
								<span class="folder-item">
									<span class="text-success fa fa-check-circle-o"
												(click)="untickNode(node)"
												*ngIf="node.codeSetValue.includeChildren && (!node.codeSetValue.exclusion || node.codeSetValue.exclusion.length == 0)"> </span>
									<span class="text-warning fa fa-times-circle-o"
												(click)="tickNode(node)"
												*ngIf="node.codeSetValue.includeChildren && (node.codeSetValue.exclusion && node.codeSetValue.exclusion.length > 0)"> </span>
									<span class="text-danger fa fa-ban"
												(click)="tickNode(node)"
												*ngIf="!node.codeSetValue.includeChildren"> </span>
									<span>{{getTerm(node.codeSetValue)}}</span>
							</span>
							</ng-template>
						</tree-root>
					</div>
				</div>
			</div>
		</form>
	</div>
	<div class="modal-footer">
		<button type="button" class="btn btn-success" (click)="ok();">OK</button>
		<button type="button" class="btn btn-danger" (click)="cancel()">Cancel</button>
	</div>
	`
})
export class CodePickerDialog implements OnInit {
	public static open(modalService: NgbModal, selection : CodeSetValue[], singleCode? : boolean, rootCode? : CodeSetValue) : NgbModalRef {
		const modalRef = modalService.open(CodePickerDialog, { backdrop : "static", size : "lg"});
		modalRef.componentInstance.resultData = selection;
		modalRef.componentInstance.singleCode = singleCode;
		modalRef.componentInstance.rootCode = rootCode;

		return modalRef;
	}

	@Input() resultData;
	@Input() singleCode? : boolean;
	@Input() rootCode? : CodeSetValue;

	options : ITreeOptions;

	highlightedMatch : CodeSetValue;
	previousSelection : CodeSetValue;
	highlightedSelection : CodeSetValue;

	searchData : string;
	searchResults : CodeSetValue[];
	parents : CodeSetValue[];
	children : CodeSetValue[];

	termCache : any;

	exclusionTreeData : ExclusionTreeNode[];

	@ViewChild('container') container: ElementRef;
	animStyle: any;
	speed = 0.5;
	breadcrumbs: CodeSetValue[] = [];


	constructor(protected activeModal : NgbActiveModal,
							protected logger : LoggerService,
							private codingService : CodingService) {
		this.termCache = {};
		this.options = {
			childrenField : 'exclusion',
			idField : 'code'
		}
	}

	ngOnInit(): void {
		this.loadRoot();
	}

	search() {
		var vm = this;

		vm.codingService.searchCodes(vm.searchData)
			.subscribe(
				(result) => {
				vm.searchResults = result;
				vm.parents = [];
				vm.children = [];
			});
	}

	loadRoot() {
		let vm = this;
		if (!vm.rootCode)
			return;

		vm.parents = [this.rootCode];
		vm.codingService.getCodeChildren(this.rootCode.code)
			.subscribe(
				(result) => vm.searchResults = result
			);
	}

	displayCode(itemToDisplay : CodeSetValue, replace : boolean) {
		var vm = this;

		// Prevent navigation above the root code if given
		if (vm.rootCode && (vm.rootCode.code == itemToDisplay.code)) {
			vm.logger.warning('You cannot navigate above the root', vm.rootCode, 'Cannot select parent');
			return;
		}

		if (vm.highlightedMatch && !vm.singleCode) {
			vm.previousSelection = vm.highlightedMatch;
		}

		if (replace) {
			vm.searchResults = [itemToDisplay];
		}
		vm.highlightedMatch = itemToDisplay;
		vm.children = [];
		vm.parents = [];
		this.animStyle = null;

		vm.codingService.getCodeChildren(itemToDisplay.code)
			.subscribe(
				(result) => vm.children = result
			);

		vm.codingService.getCodeParents(itemToDisplay.code)
			.subscribe(
				(result) => vm.parents = result
			);

	}

	addToSelection(match : CodeSetValue) {
		var item : CodeSetValue = {
			code : match.code,
			includeChildren : true,
			exclusion : []
		};
		this.resultData.push(item);
	}

	removeFromSelection(item : CodeSetValue) {
		var i = this.resultData.indexOf(item);
		if (i !== -1) {
			this.resultData.splice(i, 1);
		}
	}

	displayExclusionTree(selection : CodeSetValue) {
		var vm = this;
		vm.highlightedSelection = selection;

		vm.codingService.getCodeChildren(selection.code)
			.subscribe(
				(result) => {
				var rootNode : ExclusionTreeNode = {
					codeSetValue : selection,
					children : []
				} as ExclusionTreeNode;

				result.forEach((child) => {
					// If "includeChildren" is ticked
					if (selection.includeChildren) {
						// and no "excludes" then tick
						if ((!selection.exclusion) || selection.exclusion.length === 0) {
							child.includeChildren = true;
						} else {
							// else if this is not excluded then tick
							child.includeChildren = selection.exclusion.every((exclusion) => {
								return exclusion.code !== child.code;
							});
						}
					}

					var childNode : ExclusionTreeNode = {
						codeSetValue : child
					} as ExclusionTreeNode;

					rootNode.children.push(childNode);
				});

				vm.exclusionTreeData = [ rootNode ];
			});
	}

	tickNode(node : ExclusionTreeNode) {
		if (node.codeSetValue.code === this.highlightedSelection.code) {
			// Ticking root so empty exclusions and tick all children
			this.highlightedSelection.exclusion = [];
			this.highlightedSelection.includeChildren = true;
			node.children.forEach((item) => { item.codeSetValue.includeChildren = true; });
		} else {
			if (this.highlightedSelection.includeChildren) {
				// Ticking an excluded child so find the exclusion...
				var index = this.findWithAttr(this.highlightedSelection.exclusion, 'code', node.codeSetValue.code);
				if (index > -1) {
					// ...remove it...
					this.highlightedSelection.exclusion.splice(index, 1);
					// ...tick it...
					node.codeSetValue.includeChildren = true;
					// ...and if no exclusions are left then set as "include all" at root
					if (this.highlightedSelection.exclusion.length === 0) {
						this.highlightedSelection.includeChildren = true;
					}
				}
			} else {
				// Ticking a child on "DONT include children" so tick root...
				this.highlightedSelection.includeChildren = true;
				// ...tick the node...
				node.codeSetValue.includeChildren = true;
				// ...and add the rest as exclusions
				this.highlightedSelection.exclusion = [];
				this.exclusionTreeData[0].children.forEach((childNode) => {
					if (childNode !== node) {
						this.highlightedSelection.exclusion.push(childNode.codeSetValue);
					}
				});
			}
		}
	}

	untickNode(node : ExclusionTreeNode) {
		if (node.codeSetValue.code === this.highlightedSelection.code) {
			// Unticking root so untick all children...
			node.children.forEach((item) => { item.codeSetValue.includeChildren = false; });
			// ... and clear exclusions list
			this.highlightedSelection.exclusion = [];
		} else {
			// Unticking a child so...
			if (this.highlightedSelection.exclusion == null) {
				// Initialize exclusion array if required
				this.highlightedSelection.exclusion = [];
			}
			// ...add exclusion
			this.highlightedSelection.exclusion.push(node.codeSetValue);
		}
		// Untick the node
		node.codeSetValue.includeChildren = false;
	}

	findWithAttr(array : any[], attr : string, value : string) : number {
		for (var i = 0; i < array.length; i += 1) {
			if (array[i][attr] === value) {
				return i;
			}
		}
		return -1;
	}

	termShorten(term : string) {
		term = term.replace(' (disorder)','');
		term = term.replace(' (observable entity)','');
		term = term.replace(' (finding)','');
		return term;
	}

	getTerm(code : CodeSetValue) : string {
		if (code.term)
			return code.term;

		code.term = 'Loading...';

		const vm = this;
		vm.codingService.getPreferredTerm(code.code)
			.subscribe(
				(concept) => code.term = vm.termShorten(concept.preferredTerm)
			);

		return code.term;
	}

	ok() {
		if (this.singleCode)
			this.resultData = [this.highlightedMatch];
		this.activeModal.close(this.resultData);
		console.log('OK Pressed');
	}

	cancel() {
		this.activeModal.close(null);
		console.log('Cancel Pressed');
	}


	navigateConcept(itemToDisplay: CodeSetValue, replace: boolean, direction: number) {
		if (direction === -1)
			this.breadcrumbs.push(this.highlightedMatch);
		else
			this.breadcrumbs = this.navigateToParent(itemToDisplay);

		const delta = (this.container.nativeElement.clientWidth / 3) * direction;
		this.animStyle = {
			'-webkit-transition': this.speed + 's ease-in-out',
			'-moz-transition': this.speed + 's ease-in-out',
			'-o-transition': this.speed + 's ease-in-out',
			'transition': this.speed + 's ease-in-out',

			'-webkit-transform': 'translate(' + delta + 'px,0)',
			'-moz-transform': 'translate(' + delta + 'px,0)',
			'-o-transform': 'translate(' + delta + 'px,0)',
			'-ms-transform': 'translate(' + delta + 'px,0)',
			'transform': 'translate(' + delta + 'px,0)'
		};

		setTimeout(() => this.displayCode(itemToDisplay, replace), this.speed * 1000);
	}

	private navigateToParent(itemToDisplay) {
		if (this.breadcrumbs.length == 0)
			return [];

		const i = this.breadcrumbs.findIndex((e) => e.code === itemToDisplay.code);
		if (i == -1)
			return [];

		this.breadcrumbs.splice(i);
		return this.breadcrumbs;
	}
}
