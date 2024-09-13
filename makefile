# Makefile for Subgraph

NETWORK ?= puppynet

# Define the networks
NETWORKS = mainnet puppynet

# Validate environment variables
ifeq ($(filter $(NETWORK),$(NETWORKS)),)
    $(error Invalid value for NETWORK. Valid values: $(NETWORKS))
endif

# Define the make targets
GRAPH_CODEGEN_TARGETS = $(addprefix codegen-,$(NETWORKS))
GRAPH_BUILD_TARGETS = $(addprefix build-,$(NETWORKS))
GRAPH_DEPLOY_TARGETS = $(addprefix deploy-,$(NETWORKS))

.PHONY: all install-deps $(GRAPH_CODEGEN_TARGETS) $(GRAPH_BUILD_TARGETS) $(GRAPH_DEPLOY_TARGETS)

all: install-deps $(GRAPH_CODEGEN_TARGETS) $(GRAPH_BUILD_TARGETS)

install-deps:
	@echo "Installing npm dependencies"
	npm i --legacy-peer-deps

$(GRAPH_CODEGEN_TARGETS):
	@echo "Running code generation for $(NETWORK) network"
	yarn codegen:$(NETWORK)

$(GRAPH_BUILD_TARGETS):
	@echo "Building subgraph for $(NETWORK) network"
	yarn build:$(NETWORK)

# $(GRAPH_DEPLOY_TARGETS): TAG ?= $(shell git describe --tags --abbrev=0)
$(GRAPH_DEPLOY_TARGETS):
	@echo "Deploying subgraph for $(NETWORK) network with tag: $(TAG)"
	yarn deploy:$(NETWORK)

help:
	@echo "Available targets:"
	@echo "  make help          - Show this help message"
	@echo "  make install-deps  - Install npm dependencies"
	@echo "  make codegen-mainnet - Run code generation for mainnet"
	@echo "  make codegen-puppynet - Run code generation for puppynet"
	@echo "  make build-mainnet  - Build subgraph for mainnet"
	@echo "  make build-puppynet - Build subgraph for puppynet"
	@echo "  make deploy-mainnet - Deploy subgraph for mainnet"
	@echo "  make deploy-puppynet - Deploy subgraph for puppynet"