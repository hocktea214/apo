/**
 * Copyright 2025 CloudDetail
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Card, Flex, Popconfirm, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { deleteDataGroupApi, getDataGroupsApi } from 'src/core/api/dataGroup'
import DataGroupFilter from './DataGroupFilter'
import InfoModal from './InfoModal'
import { MdOutlineEdit } from 'react-icons/md'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { showToast } from 'src/core/utils/toast'
import { LuShieldCheck } from 'react-icons/lu'
import PermissionModal from './PermissionModal'
import DatasourceTag from './component/DatasourceTag'
import Paragraph from 'antd/es/typography/Paragraph'
import { useTranslation } from 'react-i18next'
import CustomCard from 'src/core/components/Card/CustomCard'

export default function DataGroupPage() {
  const { t } = useTranslation('core/dataGroup')
  const { t: ct } = useTranslation('common')

  const [data, setData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [groupInfo, setGroupInfo] = useState(null)

  const [infoModalVisible, setInfoModalVisible] = useState(false)
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const getDataGroups = () => {
    getDataGroupsApi({
      currentPage: currentPage,
      pageSize: pageSize,
    }).then((res) => {
      setData(res.dataGroupList)
      setTotal(res.total)
    })
  }
  const changePagination = (pagination) => {
    setPageSize(pagination.pageSize)
    setCurrentPage(pagination.current)
  }
  useEffect(() => {
    getDataGroups()
  }, [currentPage, pageSize])
  const closeInfoModal = () => {
    setInfoModalVisible(false)
    setGroupInfo(null)
  }
  const closePermissionModal = () => {
    setPermissionModalVisible(false)
    setGroupInfo(null)
  }
  const refresh = () => {
    closeInfoModal()
    closePermissionModal()
    getDataGroups()
  }
  const deleteDataGroup = (groupId: string) => {
    deleteDataGroupApi(groupId).then((res) => {
      showToast({
        color: 'success',
        title: ct('deleteSuccess'),
      })
      getDataGroups()
    })
  }
  const columns = [
    {
      title: 'groupId',
      dataIndex: 'groupId',
      key: 'groupId',
      hidden: true,
    },
    {
      title: t('dataGroupName'),
      dataIndex: 'groupName',
      width: 200,

      key: 'groupName',
    },
    {
      title: t('dataGroupDes'),
      width: 200,
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('datasource'),
      dataIndex: 'datasourceList',
      key: 'datasourceList',
      render: (value) => {
        return (
          <Paragraph
            className="m-0"
            ellipsis={{
              expandable: true,
              rows: 3,
            }}
          >
            {value?.map((item) => <DatasourceTag type={item.type} datasource={item.datasource} />)}
          </Paragraph>
        )
      },
    },
    {
      title: ct('operation'),
      dataIndex: 'operation',
      key: 'operation',
      width: 350,
      render: (_, record) => {
        return (
          <Flex align="center" justify="space-evenly">
            <Button
              type="text"
              onClick={() => {
                setInfoModalVisible(true)
                setGroupInfo(record)
              }}
              icon={<MdOutlineEdit className="text-blue-400 hover:text-blue-400" />}
            >
              <span className="text-blue-400 hover:text-blue-400">{t('edit')}</span>
            </Button>
            <Popconfirm
              title={t('confirmDelete', {
                groupName: record.groupName,
              })}
              onConfirm={() => deleteDataGroup(record.groupId)}
              okText={ct('confirm')}
              cancelText={ct('cancel')}
            >
              <Button type="text" icon={<RiDeleteBin5Line />} danger>
                {ct('delete')}
              </Button>
            </Popconfirm>
            <Button
              color="primary"
              variant="outlined"
              icon={<LuShieldCheck />}
              onClick={() => {
                setPermissionModalVisible(true)
                setGroupInfo(record)
              }}
            >
              {t('authorize')}
            </Button>
          </Flex>
        )
      },
    },
  ]
  return (
    <>
      <CustomCard
        style={{ overflow: 'hidden' }}
        classNames={{ body: 'h-full' }}
      >
        <div className="flex justify-between mb-2">
          {/* <DataGroupFilter /> */}
          <div></div>
          <Button type="primary" onClick={() => setInfoModalVisible(true)}>
            {t('add')}
          </Button>
        </div>
        <Table
          dataSource={data}
          columns={columns}
          pagination={{ current: currentPage, pageSize: pageSize, total: total, hideOnSinglePage: true }}
          onChange={changePagination}
          scroll={{ y: 'calc(100vh - 240px)' }}
          className="overflow-auto"
        ></Table>
      </CustomCard>
      <InfoModal
        open={infoModalVisible}
        closeModal={closeInfoModal}
        groupInfo={groupInfo}
        refresh={refresh}
      />
      <PermissionModal
        open={permissionModalVisible}
        closeModal={closePermissionModal}
        groupInfo={groupInfo}
        refresh={refresh}
      />
    </>
  )
}
