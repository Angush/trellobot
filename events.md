# Event Types

## Supported Events:

Put any of these in the `enabledEvents` array of your `conf.json` file to utilize the event whitelist. They should all be self-explanatory.

* `cardCreated`
* `cardDescriptionChanged`
* `cardDueDateChanged`
* `cardPositionChanged`
* `cardListChanged`
* `cardNameChanged`
* `cardUnarchived`
* `cardArchived`
* `cardDeleted`
* `commentEdited`
* `commentAdded`
* `memberAddedToCard`
* `memberAddedToCardBySelf`
* `memberRemovedFromCard`
* `memberRemovedFromCardBySelf`
* `listCreated`
* `listNameChanged`
* `listPositionChanged`
* `listUnarchived`
* `listArchived`
* `attachmentAddedToCard`
* `attachmentRemovedFromCard`
* `checklistAddedToCard`
* `checklistRemovedFromCard`
* `checklistItemMarkedComplete`
* `checklistItemMarkedIncomplete`

## Unsupported Events:

These are other events that *ostensibly exist*, but have not yet been implemented in Trellobot, or aren't available from the Trello API, so you can't get alerts for them.

* `addAdminToBoard`
* `addAdminToOrganization`
* `addBoardsPinnedToMember`
* `addLabelToCard`
* `addMemberToBoard`
* `addMemberToOrganization`
* `addToOrganizationBoard`
* `convertToCardFromCheckItem`
* `copyBoard`
* `copyCard`
* `copyChecklist`
* `copyCommentCard`
* `createBoard`
* `createBoardInvitation`
* `createBoardPreference`
* `createChecklist` 
* `createLabel`
* `createOrganization`
* `createOrganizationInvitation`
* `deleteBoardInvitation`
* `deleteCheckItem`
* `deleteLabel`
* `deleteOrganizationInvitation`
* `disablePlugin`
* `disablePowerUp`
* `emailCard`
* `enablePlugin`
* `enablePowerUp`
* `makeAdminOfBoard`
* `makeAdminOfOrganization`
* `makeNormalMemberOfBoard`
* `makeNormalMemberOfOrganization`
* `makeObserverOfBoard`
* `memberJoinedTrello`
* `moveCardFromBoard`
* `moveCardToBoard`
* `moveListFromBoard`
* `moveListToBoard`
* `removeAdminFromBoard`
* `removeAdminFromOrganization`
* `removeBoardsPinnedFromMember`
* `removeFromOrganizationBoard`
* `removeLabelFromCard`
* `removeMemberFromBoard`
* `removeMemberFromOrganization`
* `unconfirmedBoardInvitation`
* `unconfirmedOrganizationInvitation`
* `updateBoard`
* `updateCheckItem`
* `updateChecklist`
* `updateLabel`
* `updateMember`
* `updateOrganization`
* `voteOnCard`