TAG ?= v0.0.0

.PHONY: release
release:
	@test -z "$$(git status --porcelain)" || (echo "error: working tree is not clean"; exit 1)
	@if git rev-parse "$(TAG)" >/dev/null 2>&1; then \
		echo "error: tag $(TAG) already exists"; exit 1; \
	fi
	git tag "$(TAG)"
	git push origin "$(TAG)"
	@echo "Pushed $(TAG). Actions: Create Release → Publish npm."
