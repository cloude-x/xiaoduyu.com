import React from 'react';

// layout
import TwoColumns from '../../layout/two-columns';

// config
import { googleAdSense } from '@config';

// modules
import Shell from '@modules/shell';
import Meta from '@modules/meta';
import Topics from '@modules/topics';
import AppDownload from '@modules/app-download';
import LinksExchange from '@modules/links-exchange';
import OperatingStatus from '@modules/operating-status';
import Footer from '@modules/footer';
import Case from '@modules/case';
import AdsByGoogle from '@modules/adsbygoogle';
// import PostsList from '@modules/posts-list';

import PostsList from '@modules/posts-list';
import NewTips from '@modules/posts-list/components/new-tips';

export default Shell(() => {

  return(<div>
    <Meta />

    <TwoColumns>
      
      <div>
        <Topics />
        <NewTips topicId="home" />
        <PostsList
          id="home"
          query={{
            sort_by: "sort_by_date",
            deleted: false,
            weaken: false
          }}
          scrollLoad={true}
          />
      </div>
      
      <div>

        <div className="card">
        <div className="card-header">推荐</div>
        <div className="card-body p-0">
          <PostsList
            id="excellent"
            itemType="poor"
            query={{
              sort_by: "sort_by_date",
              deleted: false,
              weaken: false,
              recommend: true
            }}
            />
        </div>
        </div>
        
        {/* 
        <div className="card">
        <div className="card-header">近7天热门讨论</div>
        <div className="card-body p-0">

          <PostsList
            id="hot-home"
            itemType="poor"
            query={{
              sort_by: "comment_count:-1,like_count:-1,sort_by_date:-1",
              start_create_at: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)+'',
              deleted: false,
              weaken: false,
              page_size: 9
            }}
            />
        </div>
        </div>
        */}
        
        <AppDownload />
        <Case />
        <LinksExchange />
        
        <OperatingStatus />
      </div>

      <div>
        
        {googleAdSense.sidebar ?
            <AdsByGoogle {...googleAdSense.sidebar} />
            : null}
        <Footer />
      </div>
      
      {/* 
      <div>
        <div className="card">
        <div className="card-header">近7天热门讨论</div>
        <div className="card-body p-0">
          <PostsList
            id={'hot-home'}
            itemType={'poor'}
            filters={{
              variables: {
                sort_by: "comment_count:-1,like_count:-1,sort_by_date:-1",
                start_create_at: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
                deleted: false,
                weaken: false,
                page_size: 9
              }
            }}
            scrollLoad={false}
            showTips={false}
            />
        </div>
        </div>
        
        
        {googleAdSense.sidebar ?
          <AdsByGoogle {...googleAdSense.sidebar} />
          : null}
      </div>
      */}

    </TwoColumns>
  </div>)

})
