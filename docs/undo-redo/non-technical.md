# Undo/Redo

## Overview
The Undo/Redo feature lets users safely move backward and forward through recent field changes while editing PDFs.

## Purpose
Its purpose is to reduce editing risk. Users can try changes freely because they can quickly reverse mistakes and restore previous versions without manually rebuilding field settings.

## How it works
1. Each meaningful field change (such as add, edit, move, resize, or delete) is saved as a history step.
2. Clicking **Undo** moves one step back to the previous state.
3. Clicking **Redo** moves one step forward if an undo was done earlier.
4. Keyboard shortcuts are also supported: **Ctrl+Z** for Undo and **Ctrl+Y** for Redo.
5. To keep performance stable, history is capped to a fixed limit, so very old steps are dropped automatically.
6. If no previous or forward step exists, the corresponding action is unavailable.

## User Benefits
Users can work faster and with more confidence because accidental edits are easy to recover. The feature encourages experimentation, lowers rework effort, and improves overall editing reliability in long mapping sessions.

