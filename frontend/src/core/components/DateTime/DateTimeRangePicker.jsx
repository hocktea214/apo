/**
 * Copyright 2024 CloudDetail
 * SPDX-License-Identifier: Apache-2.0
 */

import { cilCalendar, cilClock } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import {
  CButton,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import React, { useState, useEffect } from 'react'
import { DateRange } from 'react-date-range'

import 'react-date-range/dist/styles.css' // main style file
import 'react-date-range/dist/theme/default.css' // theme css file
import './index.css'
import { useDispatch, useSelector } from 'react-redux'
import { timeRangeMap } from 'src/core/store/reducers/timeRangeReducer'
import { convertTime, ISOToTimestamp, TimestampToISO, timeUtils } from 'src/core/utils/time'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useUpdateEffect } from 'react-use'
import { useTranslation } from 'react-i18next'

const DateTimeRangePicker = React.memo((props) => {
  const { t } = useTranslation('core/dateTime')
  const location = useLocation()
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const storeTimeRange = useSelector((state) => state.timeRange)
  const [state, setState] = useState({
    startDate: timeUtils.startOfDay(new Date()),
    endDate: timeUtils.endOfDay(new Date()),
    key: 'selection',
  })
  // 展示用的starttime（取消快速范围，快速范围只用于获取精确数据）
  const [startTime, setStartTime] = useState(timeUtils.format(state.startDate, 'yyyy-MM-dd HH:mm:ss'))
  const [endTime, setEndTime] = useState(timeUtils.format(state.endDate, 'yyyy-MM-dd HH:mm:ss'))
  const [startTimeInvalid, setStartTimeInvalid] = useState(false)
  const [endTimeInvalid, setEndTimeInvalid] = useState(false)
  const [startTimeFeedback, setStartTimeFeedback] = useState()
  const [endTimeFeedback, setEndTimeFeedback] = useState()
  const [oldTimeParam, setOldTimeParam] = useState(null)

  const dispatch = useDispatch()

  const setStoreTimeRange = (value) => {
    dispatch({ type: 'SET_TIMERANGE', payload: value })
  }
  const initStorageTimeRange = (value) => {
    dispatch({ type: 'INIT_TIMERANGE', payload: value })
  }

  const initTimeRange = () => {
    setStartTime(convertTime(storeTimeRange.startTime, 'yyyy-mm-dd hh:mm:ss'))
    setEndTime(convertTime(storeTimeRange.endTime, 'yyyy-mm-dd hh:mm:ss'))
  }
  const updataUrlTimeRange = () => {
    const params = new URLSearchParams(searchParams)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const relativeTime = searchParams.get('to')

    let needChangeUrl = false
    if (storeTimeRange.rangeTypeKey) {
      if (storeTimeRange.rangeTypeKey !== relativeTime) {
        params.set('relativeTime', storeTimeRange.rangeTypeKey)
        params.delete('from')
        params.delete('to')
        needChangeUrl = true
      }
    } else {
      if (storeTimeRange.startTime !== ISOToTimestamp(from)) {
        params.set('from', TimestampToISO(storeTimeRange.startTime))
        params.delete('relativeTime')
        needChangeUrl = true
      }
      if (storeTimeRange.endTime !== ISOToTimestamp(to)) {
        params.set('to', TimestampToISO(storeTimeRange.endTime))
        params.delete('relativeTime')
        needChangeUrl = true
      }
    }
    if (needChangeUrl) {
      let url = new URL(window.location.href)
      if (url.hash) {
        // setSearchParams(params, { replace: true })
        const newUrl = `${url.origin}/${url.hash.split('?')[0]}?${params.toString()}`
        window.history.replaceState(null, '', newUrl)
      }
    }
  }

  useEffect(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const relativeTime = searchParams.get('relativeTime')
    // 判断url参数是否合法
    const fromTimestamp = ISOToTimestamp(from)
    const toTimestamp = ISOToTimestamp(to)
    const rangeTypeKey = timeRangeMap.hasOwnProperty(relativeTime) ? relativeTime : null
    if (
      oldTimeParam &&
      oldTimeParam?.from === from &&
      oldTimeParam?.to === to &&
      oldTimeParam?.relativeTime === relativeTime
    ) {
      return
    }

    if (rangeTypeKey) {
      setStoreTimeRange({
        rangeTypeKey: rangeTypeKey,
      })
      return
    }
    if (fromTimestamp && toTimestamp) {
      if (storeTimeRange.startTime !== fromTimestamp || storeTimeRange.endTime !== toTimestamp) {
        setStoreTimeRange({
          rangeTypeKey: null,
          startTime: fromTimestamp,
          endTime: toTimestamp,
        })
      }
      return
    }
    if (storeTimeRange.startTime && storeTimeRange.endTime) {
      updataUrlTimeRange()
      return
    }
    if (rangeTypeKey) {
      setStoreTimeRange({
        rangeTypeKey: relativeTime,
      })
    } else {
      const fromTimestamp = ISOToTimestamp(from)
      const toTimestamp = ISOToTimestamp(to)
      if (fromTimestamp && toTimestamp) {
        if (storeTimeRange.startTime !== fromTimestamp || storeTimeRange.endTime !== toTimestamp) {
          // console.log('url发现参数和store不符，更新精确时间')
          setStoreTimeRange({
            rangeTypeKey: null,
            startTime: fromTimestamp,
            endTime: toTimestamp,
          })
        }
      } else {
        initStorageTimeRange()
      }
    }
    setOldTimeParam({
      from,
      to,
      relativeTime,
    })
  }, [searchParams])
  // 打开下拉面板初始化该组件的数据
  useEffect(() => {
    if (dropdownVisible) {
      initTimeRange()
    }
  }, [dropdownVisible])
  // 存储数据变了初始化该组件的数据

  useUpdateEffect(() => {
    initTimeRange()
    updataUrlTimeRange()
  }, [storeTimeRange])
  // 选择的快速范围变了 修改日期选择器的时间

  // 输入框的日期时间变了 修改日期选择器的时间
  useEffect(() => {
    const startTimeValid = validStartTime()
    const endTimeValid = validEndTime()
    if (startTimeValid && endTimeValid) {
      setState({
        startDate: timeUtils.startOfDay(new Date(startTime).getTime()),
        endDate: timeUtils.endOfDay(new Date(endTime).getTime()),
        key: 'selection',
      })
    }
  }, [startTime, endTime])
  const handleSelect = (ranges) => {
    let state = ranges.selection
    setState({
      startDate: timeUtils.startOfDay(state.startDate),
      endDate: timeUtils.endOfDay(state.endDate),
      key: state.key,
    })
    setStartTime(timeUtils.format(state.startDate, 'yyyy-MM-dd HH:mm:ss'))
    if (areDatesEqual(state.endDate, new Date())) {
      setEndTime(timeUtils.format(new Date(), 'yyyy-MM-dd HH:mm:ss'))
    } else {
      setEndTime(timeUtils.format(timeUtils.endOfDay(state.endDate), 'yyyy-MM-dd HH:mm:ss'))
    }
  }

  const areDatesEqual = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }
  const changeStartTime = (event) => {
    setStartTime(event.target.value)
  }
  const changeEndTime = (event) => {
    setEndTime(event.target.value)
  }
  const selectTimeRange = (key) => {
    let timeRangeItem = timeRangeMap[key]
    setStartTime(timeRangeItem.from)
    setEndTime(timeRangeItem.to)

    setDropdownVisible(false)
    setStoreTimeRange({
      rangeTypeKey: key,
    })
  }
  const confirmTimeRange = (event) => {
    if (startTimeInvalid || endTimeInvalid) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    setStoreTimeRange({
      rangeTypeKey: null,
      startTime: new Date(startTime).getTime() * 1000,
      endTime: new Date(endTime).getTime() * 1000,
    })
    setDropdownVisible(false)
  }
  function isValidDate(dateString) {
    // 尝试解析字符串
    const date = new Date(dateString)
    // 检查是否为 Invalid Date
    if (isNaN(date.getTime())) {
      return false
    }

    return dateString === timeUtils.format(date.getTime(), 'yyyy-MM-dd HH:mm:ss')
  }
  const validStartTime = () => {
    let feedback = t('dateTimeRangePicker.selectCorrectTimeRangeFeedback')
    let result = true
    if (!startTime || startTime.length === 0 || !isValidDate(startTime)) {
      result = false
    } else if (new Date(startTime) > new Date(endTime)) {
      feedback = t('dateTimeRangePicker.startTimeLongerThanEndTimeFeedback')
      result = false
    }
    if (result) {
      feedback = ''
    }
    setStartTimeFeedback(feedback)
    setStartTimeInvalid(!result)
    return result
  }
  const validEndTime = () => {
    let feedback = t('dateTimeRangePicker.selectCorrectTimeRangeFeedback')
    let result = true
    if (!endTime || endTime.length === 0 || !isValidDate(endTime)) {
      result = false
    } else if (new Date(startTime) > new Date(endTime)) {
      feedback = t('dateTimeRangePicker.endTimeLessThanStartTimeFeedback')
      result = false
    } else if (new Date(endTime) > new Date()) {
      feedback = t('dateTimeRangePicker.endTimeLongerThanCurrentTimeFeedback')
      result = false
    }
    if (result) {
      feedback = ''
    }
    setEndTimeFeedback(feedback)
    setEndTimeInvalid(!result)
    return result
  }

  return (
    <>
      <CDropdown
        dark
        autoClose="outside"
        visible={dropdownVisible}
        onShow={() => setDropdownVisible(true)}
        onHide={() => setDropdownVisible(false)}
      >
        <CDropdownToggle
          color="dark"
          className="dateTimeRangePicker flex items-center"
          size="sm"
          onClick={() => setDropdownVisible(true)}
        >
          <CIcon icon={cilClock} className="mr-2" />
          <span className="text-sm">
            {storeTimeRange?.rangeTypeKey
              ? timeRangeMap[storeTimeRange?.rangeTypeKey].name
              : convertTime(storeTimeRange?.startTime, 'yyyy-mm-dd hh:mm:ss') +
                ' to ' +
                convertTime(storeTimeRange?.endTime, 'yyyy-mm-dd hh:mm:ss')}
          </span>
        </CDropdownToggle>
        <CDropdownMenu className="m-0 p-0">
          <div className="w-[600px] flex">
            <div className="w-3/5 border-r border-r-slate-700  px-3 py-2">
              <CForm noValidate>
                <div>{t('dateTimeRangePicker.absoluteTimeRangeTitle')}</div>

                <CFormLabel className="text-sm mt-2 block">
                  {t('dateTimeRangePicker.startTitle')}
                </CFormLabel>

                <CInputGroup className="mb-2">
                  <CFormInput
                    value={startTime}
                    type="text"
                    onChange={changeStartTime}
                    required
                    invalid={startTimeInvalid}
                    max={timeUtils.format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                  <CInputGroupText>
                    <CIcon icon={cilCalendar} />
                  </CInputGroupText>
                  <CFormFeedback invalid>{startTimeFeedback}</CFormFeedback>
                </CInputGroup>

                <CFormLabel htmlFor="basic-url" className="text-sm block">
                  {t('dateTimeRangePicker.endTitle')}
                </CFormLabel>
                <CInputGroup>
                  <CFormInput
                    value={endTime}
                    onChange={changeEndTime}
                    required
                    invalid={endTimeInvalid}
                    max={timeUtils.format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                  <CInputGroupText id="basic-addon2">
                    <CIcon icon={cilCalendar} />
                  </CInputGroupText>
                  <CFormFeedback invalid>{endTimeFeedback}</CFormFeedback>
                </CInputGroup>
                <CButton color="primary" size="sm" className="mt-3" onClick={confirmTimeRange}>
                  {t('dateTimeRangePicker.applyTimeRangeButtonText')}
                </CButton>
              </CForm>
              <DateRange
                moveRangeOnFirstSelection={false}
                showSelectionPreview={true}
                ranges={[state]}
                onChange={handleSelect}
                editableDateInputs={true}
                hh
                showDateDisplay={false}
                maxDate={new Date()}
              />
            </div>
            <div className="w-2/5">
              <div className="p-2">{t('dateTimeRangePicker.quickRangeTitle')}</div>
              <CDropdownMenu className="w-2/5 border-0">
                {Object.keys(timeRangeMap).map((key) => {
                  return (
                    <CDropdownItem
                      key={key}
                      onClick={() => selectTimeRange(key)}
                      active={storeTimeRange.rangeTypeKey === key}
                    >
                      {timeRangeMap[key].name}
                    </CDropdownItem>
                  )
                })}
              </CDropdownMenu>
            </div>
          </div>
        </CDropdownMenu>
      </CDropdown>
    </>
  )
})

export default DateTimeRangePicker
