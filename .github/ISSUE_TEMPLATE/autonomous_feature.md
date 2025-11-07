---
name: Autonomous Feature Request
about: Request a feature to be implemented autonomously by Claude Code
title: '[FEATURE] '
labels: 'feature'
assignees: ''
---

## 🎯 Feature Description
<!-- Brief description of the feature (2-3 sentences) -->



## 📋 Completion Criteria
<!-- List specific, measurable criteria that define when this feature is complete -->
<!-- Use this hybrid approach: Task Completion Criteria + Checkpoint-Based Autonomy -->

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
- [ ] All TypeScript errors resolved
- [ ] Build successful (0 errors)
- [ ] Code follows existing project patterns

## 🏁 Checkpoints
<!-- Define major milestones where Claude should pause to confirm approach before continuing -->

1. **Checkpoint 1:** [After initial planning/design] - Confirm architecture and approach
2. **Checkpoint 2:** [After core implementation] - Verify functionality and patterns
3. **Checkpoint 3:** [After integration] - Review final implementation

## 📝 Instructions for Claude Code

**Autonomy Level:** Work autonomously between checkpoints. Make all implementation decisions independently (component structure, state management, error handling, styling, etc.).

**At each checkpoint:** Show progress, demonstrate working functionality, and confirm approach before continuing to next phase.

**Communication Strategy:** Use TodoWrite tool to track progress. Mark todos as in_progress/completed in real-time.

**Reference Documentation:**
- Architecture patterns: See existing code in `src/` directory
- Autonomous work theory: [JUMPSTART.md](../JUMPSTART.md) (lines 752-908)
- Project state: [JUMPSTART.md](../JUMPSTART.md)
- Setup guide: [README.md](../README.md)

## 📎 Additional Context
<!-- Any additional information, design mockups, related issues, API documentation, etc. -->



## 🔗 Related Issues
<!-- Link related issues, dependencies, or blockers -->

- Related to: #
- Depends on: #
- Blocks: #

## 💡 Technical Considerations
<!-- Optional: Specific technical requirements, constraints, or preferences -->

- **Affected Files:** (if known)
- **New Dependencies:** (if any)
- **Breaking Changes:** (yes/no and explanation)
- **Database Changes:** (migrations needed?)

## ✅ Acceptance Criteria (Testing)
<!-- How to verify this feature works correctly -->

- [ ] Manual testing steps documented
- [ ] Edge cases handled
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] User feedback provided for all actions

---

**Example Usage:**

For reference, here's how to phrase a request for autonomous implementation:

```markdown
Implement user profile editing with these completion criteria:
✅ Profile form with name, email, bio fields created
✅ Form validation implemented
✅ API integration with Supabase for updates
✅ Success/error notifications displayed
✅ All TypeScript errors resolved
✅ Build successful

CHECKPOINTS:
1. After UI components built - confirm design and UX
2. After Supabase integration - verify data flow

Work autonomously between checkpoints. Make all implementation decisions independently.
```
