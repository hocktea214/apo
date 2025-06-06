// Copyright 2024 CloudDetail
// SPDX-License-Identifier: Apache-2.0

package permission

import (
	"errors"
	"net/http"

	"github.com/CloudDetail/apo/backend/pkg/model"
	"github.com/CloudDetail/apo/backend/pkg/model/request"

	"github.com/CloudDetail/apo/backend/pkg/code"
	"github.com/CloudDetail/apo/backend/pkg/core"
)

// ConfigureMenu Configure global menu.
// @Summary Configure global menu.
// @Description Configure global menu.
// @Tags API.permission
// @Accept application/x-www-form-urlencoded
// @Produce json
// @Param permissionList formData []int true "The list of feature's id" collectionFormat(multi)
// @Param Authorization header string false "Bearer accessToken"
// @Success 200 {object} string "ok"
// @Failure 400 {object} code.Failure
// @Router /api/permission/menu/configure [post]
func (h *handler) ConfigureMenu() core.HandlerFunc {
	return func(c core.Context) {
		req := new(request.ConfigureMenuRequest)
		if err := c.ShouldBindPostForm(req); err != nil {
			c.AbortWithError(core.Error(
				http.StatusBadRequest,
				code.ParamBindError,
				c.ErrMessage(code.ParamBindError)).WithError(err),
			)
			return
		}

		err := h.permissionService.ConfigureMenu(req)
		if err != nil {
			var vErr model.ErrWithMessage
			if errors.As(err, &vErr) {
				c.AbortWithError(core.Error(
					http.StatusBadRequest,
					vErr.Code,
					c.ErrMessage(vErr.Code),
				).WithError(err))
			} else {
				c.AbortWithError(core.Error(
					http.StatusBadRequest,
					code.ConfigureMenuError,
					c.ErrMessage(code.ConfigureMenuError)).WithError(err),
				)
			}
			return
		}
		c.Payload("ok")
	}
}
