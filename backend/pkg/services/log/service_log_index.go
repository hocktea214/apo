package log

import (
	"sort"

	"github.com/CloudDetail/apo/backend/pkg/model/request"
	"github.com/CloudDetail/apo/backend/pkg/model/response"
)

func (s *service) GetLogIndex(req *request.LogIndexRequest) (*response.LogIndexResponse, error) {
	res := &response.LogIndexResponse{}
	list, sum, err := s.chRepo.GetLogIndex(req)
	if err != nil {
		return nil, err
	}
	indexs := make([]response.IndexItem, 0)
	var count uint64
	for k, v := range list {
		count += v
		indexs = append(indexs, response.IndexItem{
			IndexName: k,
			Count:     v,
			Percent:   float64(v) * 100 / float64(sum),
		})
	}
	sort.Slice(indexs, func(i, j int) bool {
		return indexs[i].Count > indexs[j].Count
	})
	res.Indexs = indexs
	return res, nil
}
