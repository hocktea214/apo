// Copyright 2024 CloudDetail
// SPDX-License-Identifier: Apache-2.0

package alert

import (
	"net/http"

	"github.com/CloudDetail/apo/backend/pkg/code"
	"github.com/CloudDetail/apo/backend/pkg/core"
	"github.com/CloudDetail/apo/backend/pkg/model/integration/alert"
)

// UpdateSchemaData UpdateSchemaData
// @Summary UpdateSchemaData
// @Description UpdateSchemaData
// @Tags API.alertinput
// @Accept application/json
// @Produce json
// @Param Request body alert.UpdateSchemaDataRequest true "Update SchemaData Request"
// @Success 200 {object} string "ok"
// @Failure 400 {object} code.Failure
// @Router /api/alertinput/schema/data/update [post]
func (h *handler) UpdateSchemaData() core.HandlerFunc {
	return func(c core.Context) {
		req := new(alert.UpdateSchemaDataRequest)
		if err := c.ShouldBindJSON(req); err != nil {
			c.AbortWithError(core.Error(
				http.StatusBadRequest,
				code.ParamBindError,
				c.ErrMessage(code.ParamBindError)).WithError(err),
			)
			return
		}

		err := h.inputService.UpdateSchemaData(req)
		if err != nil {
			c.AbortWithError(core.Error(
				http.StatusBadRequest,
				code.UpdateSchemaDataFailed,
				c.ErrMessage(code.UpdateSchemaDataFailed)).WithError(err),
			)
			return
		}
		c.Payload("ok")
	}
}
