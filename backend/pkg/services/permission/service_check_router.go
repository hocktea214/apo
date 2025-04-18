// Copyright 2025 CloudDetail
// SPDX-License-Identifier: Apache-2.0

package permission

import (
	"errors"

	"github.com/CloudDetail/apo/backend/pkg/code"
	"github.com/CloudDetail/apo/backend/pkg/model"
)

func (s *service) CheckRouterPermission(userID int64, routerTo string) (bool, error) {
	router, err := s.dbRepo.GetRouter(routerTo)
	if err != nil {
		return false, err
	}

	if router == nil {
		return false, model.NewErrWithMessage(errors.New("router does not exist"), code.RouterNotExistsError)
	}
	features, err := s.getUserFeatureIDs(userID)
	if err != nil {
		return false, err
	}

	menuMappings, err := s.dbRepo.GetFeatureMappingByFeature(features, model.MAPPED_TYP_MENU)
	if err != nil {
		return false, err
	}

	routerMappings, err := s.dbRepo.GetFeatureMappingByFeature(features, model.MAPPED_TYP_ROUTER)
	if err != nil {
		return false, err
	}

	menuIDs := make([]int, len(menuMappings))
	for i := range menuMappings {
		menuIDs[i] = menuMappings[i].MappedID
	}

	routers, err := s.dbRepo.GetItemsRouter(menuIDs)
	if err != nil {
		return false, err
	}

	authRouters := make(map[int]struct{})
	for _, rm := range routerMappings {
		authRouters[rm.MappedID] = struct{}{}
	}

	for _, r := range routers {
		authRouters[r.RouterID] = struct{}{}
	}

	_, ok := authRouters[router.RouterID]
	return ok, nil
}
