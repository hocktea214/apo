// Copyright 2024 CloudDetail
// SPDX-License-Identifier: Apache-2.0

package alerts

import (
	"net/http"

	"github.com/CloudDetail/apo/backend/pkg/code"
	"github.com/CloudDetail/apo/backend/pkg/core"
	"github.com/CloudDetail/apo/backend/pkg/model/request"
)

// InputAlertManager get AlertManager alarm events
// @Summary get AlertManager alarm events
// @Description get AlertManager alarm events
// @Tags API.alerts
// @Accept application/json
// @Produce json
// @Param Request body request.InputAlertManagerRequest true "Request information"
// @Success 200 string ok
// @Failure 400 {object} code.Failure
// @Router /api/alerts/inputs/alertmanager [post]
func (h *handler) InputAlertManager() core.HandlerFunc {
	return func(c core.Context) {
		req := new(request.InputAlertManagerRequest)
		if err := c.ShouldBindJSON(req); err != nil {
			c.AbortWithError(core.Error(
				http.StatusBadRequest,
				code.ParamBindError,
				code.Text(code.ParamBindError)).WithError(err),
			)
			return
		}

		if err := h.alertService.InputAlertManager(req); err != nil {
			c.AbortWithError(core.Error(
				http.StatusBadRequest,
				code.DbConnectError,
				code.Text(code.DbConnectError)).WithError(err),
			)
			return
		}
		c.Payload("ok")
	}
}
