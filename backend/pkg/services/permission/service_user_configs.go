// Copyright 2024 CloudDetail
// SPDX-License-Identifier: Apache-2.0

package permission

import (
	"github.com/CloudDetail/apo/backend/pkg/model"
	"github.com/CloudDetail/apo/backend/pkg/model/request"
	"github.com/CloudDetail/apo/backend/pkg/model/response"
	"github.com/CloudDetail/apo/backend/pkg/repository/database"
	"sort"
)

// GetUserConfig Gets menus and routes that users can view.
func (s *service) GetUserConfig(req *request.GetUserConfigRequest) (response.GetUserConfigResponse, error) {
	var resp response.GetUserConfigResponse
	featureIDs, err := s.getUserFeatureIDs(req.UserID)
	if err != nil {
		return resp, err
	}

	res, err := s.dbRepo.GetFeatureMappingByFeature(featureIDs, model.MAPPED_TYP_MENU)
	itemIDs := make([]int, len(res))
	for i := range res {
		itemIDs[i] = res[i].MappedID
	}
	if err != nil {
		return resp, err
	}

	items, err := s.dbRepo.GetMenuItems()
	if err != nil {
		return resp, err
	}

	err = s.dbRepo.FillItemRouter(&items)
	if err != nil {
		return resp, err
	}
	var routers []*database.Router
	for i := range items {
		if items[i].Router != nil {
			routers = append(routers, items[i].Router)
		}
	}

	err = s.dbRepo.GetRouterInsertedPage(routers, req.Language)
	if err != nil {
		return resp, err
	}

	err = s.dbRepo.GetMenuItemTans(&items, req.Language)
	if err != nil {
		return resp, err
	}
	menuItemMap := make(map[int]*database.MenuItem)
	var rootMenuItems []*database.MenuItem

	for _, item := range items {
		m := item
		menuItemMap[m.ItemID] = &m
	}

	addedToRoot := make(map[int]bool)

	for _, id := range itemIDs {
		item := menuItemMap[id]
		if item.ParentID == nil {
			if !addedToRoot[item.ItemID] {
				rootMenuItems = append(rootMenuItems, menuItemMap[item.ItemID])
				addedToRoot[item.ItemID] = true
			}
		} else {
			if parent, exists := menuItemMap[*item.ParentID]; exists {
				parent.Children = append(parent.Children, *menuItemMap[item.ItemID])

				if !addedToRoot[parent.ItemID] {
					rootMenuItems = append(rootMenuItems, parent)
					addedToRoot[parent.ItemID] = true
				}
			}
		}
	}

	// Get routers.
	resp.Routes = make([]string, len(routers))
	for i, router := range routers {
		resp.Routes[i] = router.RouterTo
	}

	sort.Slice(rootMenuItems, func(i, j int) bool {
		return rootMenuItems[i].Order < rootMenuItems[j].Order
	})

	resp.MenuItem = rootMenuItems
	return resp, nil
}
