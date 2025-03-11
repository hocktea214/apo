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

// PermissionOperation Grant or revoke user's permission(feature).
// @Summary Grant or revoke user's permission(feature).
// @Description Grant or revoke user's permission(feature).
// @Tags API.permission
// @Accept application/x-www-form-urlencoded
// @Produce json
// @Param subjectId formData int64 true "The id of authorized subject"
// @Param subjectType formData string true "The type of authorized subject: 'role','user','team'"
// @Param type formData string true "The type of authorization: 'feature','data'"
// @Param permissionList formData []int false "The list of permissions' id" collectionFormat(multi)
// @Success 200 {object} string "ok"
// @Failure 400 {object} code.Failure
// @Router /api/permission/operation [post]
func (h *handler) PermissionOperation() core.HandlerFunc {
	return func(c core.Context) {
		req := new(request.PermissionOperationRequest)
		if err := c.ShouldBindPostForm(req); err != nil {
			c.AbortWithError(core.Error(
				http.StatusBadRequest,
				code.ParamBindError,
				c.ErrMessage(code.ParamBindError)).WithError(err),
			)
			return
		}

		err := h.permissionService.PermissionOperation(req)
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
					code.UserGrantPermissionError,
					c.ErrMessage(code.UserGrantPermissionError),
				).WithError(err))
			}
			return
		}
		c.Payload("ok")
	}
}
