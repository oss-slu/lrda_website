**Original Issue** https://github.com/oss-slu/lrda_website/issues/155

**Description**
**As** a user,
**I want** the media upload buttons (video and audio) to be moved to the toolbar,
**So that** the interface feels more organized and the media upload options are easily accessible from the toolbar.

**Tasks**

- [ ] Identify the current location of the video and audio upload buttons.
- [ ] Move the video and audio upload buttons to the toolbar.
  - Ensure that the new buttons fit well in the toolbar design and do not overcrowd it.
- [ ] Update any related functionality that depends on the current location of the media upload buttons.
- [ ] Ensure that the moved buttons retain their original functionality (i.e., upload functionality works the same as before).
- [ ] regression free
  - committed code will not break other functionalities or previous commits
- [ ] Create a test cases for your code
  - [ ] Ensure that the tour starts correctly.
  - [ ] Ensure that users can skip or continue the tour seamlessly.
  - [ ] Ensure that the tour progresses step-by-step without issues.

**Acceptance Criteria**

- [ ] The video and audio upload buttons are successfully moved to the toolbar.
- [ ] The buttons fit well in the toolbar and do not interfere with other toolbar functionalities.
- [ ] The video and audio upload functionalities work the same as before after the buttons are moved.
- [ ] Code is well commented and adheres to the project’s code style.
- [ ] All test cases pass before merging the changes.
- [ ] The implementation should not break any existing functionality or pages.
