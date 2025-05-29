import BackButtonHeader from '@/components/header/back-button-header'
import React from 'react'

const page = () => {
    return (
        <div className='p-6 space-y-6'>
            <BackButtonHeader backHref='/' text='Request Service' />
            <span>All the service request by different USER&apos;s will be visible here</span>
        </div>
    )
}

export default page
