/**
 * Copyright 2024 CloudDetail
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react'
import {
  getServiceListApi,
  getNamespacesApi,
  getServiceEndpointNameApi,
} from 'src/core/api/service'
import { useSelector } from 'react-redux'
import { selectSecondsTimeRange } from 'src/core/store/reducers/timeRangeReducer'
import { Select } from 'antd'
import { getStep } from 'src/core/utils/step'
import { useTranslation } from 'react-i18next'
import { getDatasourceByGroupApi } from 'src/core/api/dataGroup'
import FilterSelector from './FilterSelector'
import React from 'react'

const TableFilter = (props) => {
  const { t } = useTranslation('oss/service')
  const { setServiceName, setEndpoint, setNamespace, groupId, className = '' } = props
  const [serviceNameOptions, setServiceNameOptions] = useState([])
  const [endpointNameOptions, setEndpointNameOptions] = useState([])
  const [namespaceOptions, setNamespaceOptions] = useState([])
  const [searchServiceName, setSearchServiceName] = useState(null)
  const [searchEndpointName, setSearchEndpointName] = useState(null)
  const [searchNamespace, setSearchNamespace] = useState(null)
  const [datasource, setDatasource] = useState()

  // get the service name options
  const getEndpointNameOptions = () => {
    const endpoints = []
    const endpointsSet = new Set([])
    const filterOptions =
      searchServiceName?.length > 0
        ? serviceNameOptions.filter((service) => searchServiceName.includes(service.label))
        : serviceNameOptions

    filterOptions.map((option) => {
      endpoints.push({
        label: option.label,
        title: option.label,
        options: datasource?.serviceMap[option.label]?.map((item) => {
          endpointsSet.add(item)
          return {
            label: <span>{item}</span>,
            value: item,
            key: `${option.label}-${item}`
          }
        }),
      })
    })
    setSearchEndpointName(searchEndpointName?.filter((endpoint) => endpointsSet.has(endpoint)))
    setEndpointNameOptions(endpoints)
  }

  useEffect(() => {
    if (searchNamespace && searchNamespace?.length > 0) {
      const services = []
      searchNamespace.map((namespace) => {
        datasource?.namespaceMap[namespace]?.map((service) => {
          services.push({
            label: service,
            value: service,
            key: `${namespace}-${service}`
          })
        })
      })
      setServiceNameOptions(services)
    } else {
      setServiceNameOptions(
        Object.entries(datasource?.serviceMap || []).map(([service, endpoints]) => ({
          label: service,
          value: service,
          endpoints: endpoints,
          key: service
        })),
      )
    }
  }, [searchNamespace])

  const getDatasourceByGroup = () => {
    getDatasourceByGroupApi({
      groupId: groupId,
      category: 'apm',
    }).then((res) => {
      //todo null
      const namespaceOptions = Object.entries(res.namespaceMap).map(([namespace, service]) => ({
        label: namespace,
        value: namespace,
        key: namespace
      }))
      const serviceOptions = Object.entries(res.serviceMap || []).map(([service, endpoints]) => ({
        label: service,
        value: service,
        endpoints: endpoints,
        key: service
      }))
      setDatasource(res)
      setNamespaceOptions(namespaceOptions)
      setServiceNameOptions(serviceOptions)
    })
  }

  useEffect(() => {
    getDatasourceByGroup()
  }, [groupId])

  useEffect(() => {
    getEndpointNameOptions()
  }, [serviceNameOptions, searchServiceName])
  useEffect(() => {
    setNamespace(searchNamespace)
  }, [searchNamespace])
  useEffect(() => {
    setServiceName(searchServiceName)
  }, [searchServiceName])
  useEffect(() => {
    setEndpoint(searchEndpointName)
  }, [searchEndpointName])

  return (
    <>
      <div className={`flex flex-row w-full ${className}`}>
        <FilterSelector
          label={t('tableFilter.namespacesLabel')}
          placeholder={t('tableFilter.namespacePlaceholder')}
          value={searchNamespace}
          onChange={(e) => setSearchNamespace(e)}
          options={namespaceOptions}
          id="namespace"
        />
        <FilterSelector
          label={t('tableFilter.applicationsLabel')}
          placeholder={t('tableFilter.applicationsPlaceholder')}
          value={searchServiceName}
          onChange={(e) => setSearchServiceName(e)}
          options={serviceNameOptions}
          id="serviceName"
        />
        <FilterSelector
          label={t('tableFilter.endpointsLabel')}
          placeholder={t('tableFilter.endpointsPlaceholder')}
          value={searchEndpointName}
          onChange={(e) => setSearchEndpointName(e)}
          options={endpointNameOptions}
          id="endpointName"
        />
        <div>{/* <ThresholdCofigModal /> */}</div>
      </div>
    </>
  )
}

export default React.memo(TableFilter)