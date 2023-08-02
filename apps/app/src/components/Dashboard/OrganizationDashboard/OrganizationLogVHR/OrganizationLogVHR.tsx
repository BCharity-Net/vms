import { SearchIcon } from '@heroicons/react/outline'
import {
  PublicationMainFocus,
  PublicationMetadataV2Input
} from '@lens-protocol/client'
import React, { useMemo, useState } from 'react'
import { v4 } from 'uuid'

import { Spinner } from '@/components/UI/Spinner'
import { APP_NAME } from '@/constants'
import getUserLocale from '@/lib/getUserLocale'
import checkAuth from '@/lib/lens-protocol/checkAuth'
import createCollect from '@/lib/lens-protocol/createCollect'
import createComment from '@/lib/lens-protocol/createComment'
import useVHRRequests from '@/lib/lens-protocol/useVHRRequests'
import { PostTags } from '@/lib/types'
import { useAppPersistStore } from '@/store/app'

import Error from '../../Modals/Error'
import DashboardDropDown from '../../VolunteerDashboard/DashboardDropDown'
import VHRDetailCard from './VHRDetailCard'
import VHRVerifyCard from './VHRVerifyCard'

interface IOrganizationLogVHRProps {}

const OrganizationLogVHRTab: React.FC<IOrganizationLogVHRProps> = () => {
  const { currentUser: profile } = useAppPersistStore()

  const { loading, data, error, refetch } = useVHRRequests({ profile })

  const [selectedId, setSelectedId] = useState('')
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({})

  const selectedValue = useMemo(() => {
    return data.find((val) => val.metadata_id === selectedId) ?? null
  }, [data, selectedId])

  const [verifyOrRejectError, setVerifyOrRejectError] = useState('')

  const setIdPending = (id: string) => {
    const newPendingIds = { ...pendingIds, [id]: true }
    setPendingIds(newPendingIds)
  }

  const removeIdPending = (id: string) => {
    setPendingIds({ ...pendingIds, [id]: false })
  }

  const onAcceptClick = (id: string) => {
    if (profile === null) return

    setIdPending(id)

    checkAuth(profile.ownedBy)
      .then(() => createCollect(id))
      .then((res) => {
        if (res.isFailure()) {
          throw res.error.message
        } else {
          refetch()
        }
      })
      .catch((err) => {
        console.log(err)
        setVerifyOrRejectError(err?.message ?? err)
      })
      .finally(() => {
        removeIdPending(id)
      })
  }

  const onRejectClick = (id: string) => {
    if (profile === null) return

    setIdPending(id)

    checkAuth(profile.ownedBy)
      .then(() => {
        const metadata: PublicationMetadataV2Input = {
          version: '2.0.0',
          metadata_id: v4(),
          content: `#${PostTags.VhrRequest.Reject}`,
          locale: getUserLocale(),
          tags: [PostTags.VhrRequest.Reject],
          mainContentFocus: PublicationMainFocus.TextOnly,
          name: `${PostTags.VhrRequest.Reject} by ${profile?.handle}`,
          attributes: [],
          appId: APP_NAME
        }

        return createComment(id, profile, metadata)
      })
      .then((res) => {
        if (res.isFailure()) {
          throw res.error.message
        } else {
          refetch()
        }
      })
      .catch((err) => {
        console.log(err)
        setVerifyOrRejectError(err?.message ?? err)
      })
      .finally(() => {
        removeIdPending(id)
      })
  }

  const shouldShowError = () => {
    return (
      (verifyOrRejectError &&
        !verifyOrRejectError.startsWith('UserRejectedRequestError') &&
        !verifyOrRejectError.startsWith('User rejected the request')) ||
      error
    )
  }

  const getErrorMessage = () => {
    if (error) {
      return error
    } else if (
      verifyOrRejectError &&
      !verifyOrRejectError.startsWith('UserRejectedRequestError') &&
      !verifyOrRejectError.startsWith('User rejected the request')
    ) {
      return verifyOrRejectError
    }
  }

  return (
    <div className="mx-4 my-8 flex flex-col max-h-screen">
      <div className="flex flex-wrap gap-y-5 justify-around items-center mt-10">
        <div className="flex justify-between w-[300px] h-[50px] bg-white items-center rounded-md border-violet-300 border-2 ml-10 mr-10 dark:bg-black">
          <input
            className="focus:ring-0 border-none outline-none focus:border-none focus:outline-none  bg-transparent rounded-2xl w-[250px]"
            type="text"
            // value={searchValue}
            placeholder="Search"
            // onChange={(e) => {
            //   setSearchValue(e.target.value)
            // }}
          />
          <div className="h-5 w-5 mr-5">
            <SearchIcon />
          </div>
        </div>

        <div className="flex flex-wrap gap-y-5 justify-around w-[420px] items-center">
          <div className="h-[50px] z-10 ">
            <DashboardDropDown
              label="Filter:"
              options={[]}
              onClick={(c) => console.log('change filter', c)}
              selected={''}
            />
          </div>
        </div>
      </div>

      <button onClick={() => refetch()}>Refresh</button>
      {!loading ? (
        <>
          <div className="flex flex-col min-h-96 overflow-auto bg-zinc-50 shadow-md shadow-black px-4 py-3 rounded-md mt-10">
            {data.map((value) => {
              const selected = value.metadata_id === selectedId

              return (
                <VHRVerifyCard
                  pending={!!pendingIds[value.metadata_id]}
                  selected={selected}
                  key={value.metadata_id}
                  value={value}
                  onClick={() =>
                    setSelectedId(selected ? '' : value.metadata_id)
                  }
                  onAcceptClick={() => onAcceptClick(value.metadata_id)}
                  onRejectClick={() => onRejectClick(value.metadata_id)}
                />
              )
            })}
          </div>
          {selectedValue && <VHRDetailCard value={selectedValue} />}
        </>
      ) : (
        <Spinner />
      )}
      {shouldShowError() && (
        <Error
          message={`An error occured: ${getErrorMessage()}. Please try again`}
        ></Error>
      )}
    </div>
  )
}

export default OrganizationLogVHRTab
