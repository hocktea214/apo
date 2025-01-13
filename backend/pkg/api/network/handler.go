// Copyright 2024 CloudDetail
// SPDX-License-Identifier: Apache-2.0

package deepflow

import (
	"github.com/CloudDetail/apo/backend/pkg/core"
	"github.com/CloudDetail/apo/backend/pkg/repository/clickhouse"
	"github.com/CloudDetail/apo/backend/pkg/services/network"
	"go.uber.org/zap"
)

type Handler interface {
	// GetPodMap query pod network call topology and call metrics
	// @Tags API.network
	// @Router /api/network/podmap [get]
	GetPodMap() core.HandlerFunc
	// Segmentation metric of the time consumed by the GetSpanSegmentsMetrics client to call the Span network.
	// @Tags API.network
	// @Router /api/network/segments [get]
	GetSpanSegmentsMetrics() core.HandlerFunc
}

type handler struct {
	logger         *zap.Logger
	networkService network.Service
}

func New(logger *zap.Logger, chRepo clickhouse.Repo) Handler {
	return &handler{
		logger:         logger,
		networkService: network.New(chRepo),
	}
}
