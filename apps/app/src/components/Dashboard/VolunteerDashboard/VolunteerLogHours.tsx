import {
  ArrowCircleRightIcon,
  CalendarIcon,
  ClockIcon,
  LinkIcon,
  ViewListIcon
} from '@heroicons/react/outline'
import { PostFragment, PublicationTypes } from '@lens-protocol/client'
import { Inter } from '@next/font/google'
import React, { useEffect, useState } from 'react'

import { Spinner } from '@/components/UI/Spinner'
import usePostData from '@/lib/lens-protocol/usePostData'
import {
  getOpportunityMetadata,
  isComment,
  OpportunityMetadata,
  PostTags
} from '@/lib/metadata'
import { useAppPersistStore } from '@/store/app'

import Error from '../Modals/Error'
import DashboardDropDown from './DashboardDropDown'

interface IVolunteerLogHoursProps {}

const inter500 = Inter({
  subsets: ['latin'],
  weight: ['500']
})

const VolunteerLogHours: React.FC<IVolunteerLogHoursProps> = () => {
  const { currentUser: profile } = useAppPersistStore()

  const { loading, data, error, refetch } = usePostData({
    profileId: profile?.id,
    publicationTypes: [PublicationTypes.Comment],
    metadata: { tags: { oneOf: [PostTags.Bookmark.Opportunity] } }
  })
  const [metaData, setMetaData] = useState<OpportunityMetadata[]>([])
  const [indice, setIndice] = useState<number[]>([])
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const _metaData = data
      .filter(isComment)
      .map((v) => v.mainPost)
      .filter((v): v is PostFragment => v.__typename === 'Post')

    setMetaData(getOpportunityMetadata(_metaData))
    setIndice(resetIndice())
    const _categories = new Set<string>()
    metaData.forEach((v) => _categories.add(v.category))
    setCategories(Array.from(_categories))
  }, [data])

  const resetIndice = () => {
    let indice = []
    for (let i = 0; i < metaData.length; i++) {
      indice.push(i)
    }
    return indice
  }

  const [selectedSortBy, setSelectedSortBy] = useState<string>('')
  const sortByOptions = ['Start Date', 'End Date', 'Total Hours']

  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [displayIndex, setDisplayIndex] = useState(-1)

  const sortByStartDate = () => {
    indice.sort((a, b) => {
      if (metaData[a].startDate < metaData[b].startDate) return -1
      else return 1
    })
  }

  const sortByEndDate = () => {
    indice.sort((a, b) => {
      if (metaData[a].endDate < metaData[b].endDate) return -1
      else return 1
    })
  }

  const sortByHours = () => {
    indice.sort((a, b) => {
      if (metaData[a].hoursPerWeek < metaData[b].hoursPerWeek) return -1
      else return 1
    })
  }

  return (
    <div className="mt-10 ml-20">
      <div className="flex py-5 items-center">
        <div className="mr-5 h-[50px] z-10">
          <DashboardDropDown
            label="Sort By:"
            selected={selectedSortBy}
            options={Array.from(sortByOptions)}
            onClick={(c) => {
              if (c == 'Start Date') {
                sortByStartDate()
              } else if (c == 'End Date') {
                sortByEndDate()
              } else if (c == 'Total Hours') {
                sortByHours()
              }
              setSelectedSortBy(c)
            }}
          />
        </div>
        <div className="mx-5 h-[50px] z-10">
          <DashboardDropDown
            label="Filters:"
            selected={selectedCategory}
            options={Array.from(categories)}
            onClick={(c) => setSelectedCategory(c)}
          />
        </div>
        <button
          className="ml-3 min-w-[110px] h-fit text-red-500 bg-[#ffc2d4] border-red-500 border-2 rounded-md px-2 hover:bg-red-500 hover:text-white hover:cursor-pointer dark:text-[#fff2f2] dark:text-opacity-80 dark:bg-[#555591] dark:border-[#20203f] dark:hover:bg-[#20203f] dark:hover:text-opacity-100 dark:hover:text-[#ff8585]"
          onClick={() => {
            setSelectedSortBy('')
            setSelectedCategory('')
            setIndice(resetIndice())
            setDisplayIndex(-1)
          }}
        >
          Clear Filters
        </button>
      </div>

      <div
        className={` w-fit overflow-scroll ${
          displayIndex == -1 ? 'max-h-[470px]' : 'max-h-[250px]'
        } `}
      >
        {loading ? (
          <Spinner />
        ) : (
          <>
            {indice
              .filter(
                (idx) =>
                  selectedCategory === '' ||
                  metaData[idx].category == selectedCategory
              )
              .map((op) => (
                <div
                  className={`flex justify-between items-center my-5 tracking-wide w-[800px] h-[50px] bg-[#CEBBF8] bg-opacity-[0.50] rounded-md shadow-md hover:bg-opacity-100 hover:cursor-pointer hover:h-[60px] duration-100 ${
                    inter500.className
                  } ${displayIndex == op ? 'bg-blue-200' : ''}`}
                  key={op}
                  onClick={() => {
                    if (displayIndex == -1 || displayIndex != op)
                      setDisplayIndex(op)
                    else setDisplayIndex(-1)
                  }}
                >
                  <div className="flex justify-between items-center ml-10">
                    <p className="mx-5 w-[200px] h-[30px] overflow-scroll whitespace-nowrap">
                      {metaData[op].name}
                    </p>
                    <p className="mx-5 w-[100px]">{metaData[op].startDate}</p>
                    <p className="mx-5 w-[100px]">{metaData[op].endDate}</p>
                    <p className="mx-5 w-[100px]">
                      {metaData[op].hoursPerWeek} hours
                    </p>
                  </div>
                  <a href="https://google.com" target="_blank">
                    <ArrowCircleRightIcon className="mr-10 w-6 h-6" />
                  </a>
                </div>
              ))}
          </>
        )}
      </div>
      {displayIndex != -1 && (
        <div
          className={`flex my-10 tracking-wide w-[800px] h-[300px] bg-[#CEBBF8] bg-opacity-[0.30] rounded-md shadow-md ${inter500.className}`}
        >
          <div className="w-[400px]">
            <div className="flex justify-around mt-5 text-xl h-fit">
              <div className="flex items-center">
                <LinkIcon className="w-5 h-5 mr-4" />
                {metaData[displayIndex].name}
              </div>
            </div>
            <div className="flex items-center ml-5 mt-5">
              <CalendarIcon className="w-5 h-5 mr-2" />
              {metaData[displayIndex].startDate} to{' '}
              {metaData[displayIndex].endDate}
            </div>
            <div className="flex items-center ml-5 mt-2">
              <ClockIcon className="w-5 h-5 mr-2" />{' '}
              {metaData[displayIndex].hoursPerWeek} hours in total
            </div>
            <div className="flex items-center ml-5 mt-2">
              <ViewListIcon className="w-5 h-5 mr-2" />{' '}
              {metaData[displayIndex].category}
            </div>
          </div>
          <div className="h-[250px] self-center w-[2px] bg-[#D8C0EC]"></div>
          <div className="flex justify-around w-[400px]">
            <div className="w-[350px] mt-5 mb-5 overflow-scroll">
              {metaData[displayIndex].description}
            </div>
          </div>
        </div>
      )}
      {error && <Error message={error}></Error>}
    </div>
  )
}

export default VolunteerLogHours
