# Git & Version Control: Note Taking App
## Learning Objectives

* **Version Control Fundamentals**: Understand what Git is and how it tracks changes in software development.
* **Repository Management**: Manage repositories effectively using commits, branches, and merges.
* **Branching Strategy**: Implement a three-branch workflow with main (stable), dev (integration), and feature branches.
* **Pull Requests & Code Review**: Create pull requests and collaborate with Teaching Assistants for code review.
* **Conflict Resolution**: Resolve merge conflicts and interpret commit history.

---

## Introduction

You will enhance your previously built Note-Taking Web App by adding new features using professional Git workflows. This lab focuses on implementing a three-branch strategy (main → dev → feature branches). You'll create feature branches for each enhancement, commit changes with proper messages, and submit pull requests to your assigned TA for review and merge.

---

## Project Setup

### 1. Initialize Git Repository

```bash
cd your-note-app-directory
git init
```

### Create .gitignore

```
node_modules/
.DS_Store
.env
dist/
*.log
```

---

### 2. Set Up Branch Structure

```bash
# Configure Git
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Create initial commit
git add .
git commit -m "Initial commit: Base note-taking app"

# Create dev branch
git checkout -b dev

# Connect to remote (GitHub/GitLab)
git remote add origin <your-repository-url>

git push -u origin main
git push -u origin dev
```

---

## Branch Structure

* **main**: Production-ready, stable code only
* **dev**: Integration branch where TAs merge your features
* **feature/***: Individual feature branches you create

---

## Tasks

### Required Features (Implement All 4)

---

### Feature 1: Export/Import Notes

#### Requirements:

* Export all notes as JSON file
* Import notes from JSON file
* Validate imported data structure
* Prevent duplicate notes during import

---

### Feature 2: Note Categories/Folders

#### Requirements:

* Create custom categories
* Assign notes to categories
* Filter notes by category
* Display category badges on notes

---

### Feature 3: Rich Text Formatting

#### Requirements:

* Bold, italic, underline formatting
* Bullet and numbered lists
* Preserve formatting in localStorage
* Display formatted text correctly

---

### Feature 4: Note Sharing Links

#### Requirements:

* Generate unique shareable links
* Create read-only view for shared notes
* Copy link to clipboard functionality

---

## Git Workflow (Repeat for Each Feature)

---

### Step 1: Create Feature Branch

```bash
git checkout dev
git pull origin dev
git checkout -b feature/feature-name
```

### Branch Naming

* feature/export-import-notes
* feature/note-categories
* feature/rich-text-formatting
* feature/note-sharing

---

### Step 2: Implement & Commit

Make changes and commit frequently (minimum 3 commits per feature):

```bash
git add src/export.js
git commit -m "feat(export) - Added export notes to JSON functionality"

git add src/import.js
git commit -m "feat(import) - Added import notes with validation"

git add index.html src/ui.js styles.css
git commit -m "feat(ui) - Added export/import UI buttons"

git push -u origin feature/export-import-notes
```

---

### Step 3: Create Pull Request

On GitHub:

1. Click **"New Pull Request"**
2. Base: **dev ← Compare: feature/your-feature-name**
3. Fill in PR template:

```
## Description
Brief overview of the feature

## Changes Made
- List of specific changes
- Files modified
- New functionality added

## Testing Done
- How you tested the feature
- Edge cases covered

## Screenshots
[If UI changes, attach images]
```

4. Assign to your TA
5. Add label: **feature**

---

## Evaluation Criteria

| Criteria                     | Score | Description                                                                                                                            |
| ---------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Repository Setup & Structure | 15%   | Properly initializes repository with .gitignore, sets up three-branch strategy (main/dev/feature), and connects to remote.             |
| Branching Workflow           | 25%   | Creates appropriate feature branches with correct naming, maintains clean branch structure, and properly deletes branches after merge. |
| Commit Quality               | 25%   | Writes clear, descriptive commit messages. Makes minimum 3 logical commits per feature. Commits represent discrete units of work.      |
| Pull Request Management      | 20%   | Creates 4 well-documented PRs (one per feature) with clear descriptions and testing notes. Responds to TA feedback appropriately.      |
| Conflict Resolution          | 15%   | Successfully resolves at least one merge conflict, demonstrating understanding of conflict markers and resolution process.             |

---

## Deliverables

### 1. GitHub Repository

* Public repository with all code
* Visible commit history showing main, dev, and feature branches
* Minimum 4 merged pull requests
* Minimum 12 total commits (3+ per feature)

---

### 2. Four Pull Requests

Each PR must include:

* Clear title and description
* Minimum 3 commits
* TA approval before merge

---

### 3. GIT_WORKFLOW.md File

```
# Git Workflow Documentation

## Branching Strategy
Explain your three-branch approach

## Commit Conventions
Your commit message style

## Merge Conflicts Encountered
Describe at least one conflict and how you resolved it

## Git Commands Used
List of commands you found most useful

## Screenshots
- Git log showing commit history
- Branch structure
- Example resolved conflict
- Example pull request
```

---

### 4. Feature Checklist (For Each Feature)

* [ ] Created feature branch from dev
* [ ] Made minimum 3 commits with clear messages
* [ ] Pushed feature branch to remote
* [ ] Created pull request to dev branch
* [ ] Assigned PR to TA
* [ ] Addressed TA feedback (if any)
* [ ] TA approved and merged PR
* [ ] Pulled updated dev branch
* [ ] Deleted feature branch locally and remotely
