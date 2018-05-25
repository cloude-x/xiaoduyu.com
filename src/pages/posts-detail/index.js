import React from 'react';

// redux
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { loadPostsList, viewPostsById } from '../../actions/posts';
import { getPostsListByListId } from '../../reducers/posts';
import { isMember } from '../../reducers/user';

// components
import Shell from '../../components/shell';
import Meta from '../../components/meta';
// import Sidebar from '../../components/sidebar';
import CommentList from '../../components/comment/list';
import PostsList from '../../components/posts/list';
import PostsDetailC from '../../components/posts/detail';
import EditorComment from '../../components/editor-comment';
import Loading from '../../components/ui/loading';


// styles
import CSSModules from 'react-css-modules';
import styles from './style.scss';

@connect(
  (state, props) => ({
    isMember: isMember(state),
    list: getPostsListByListId(state, props.match.params.id)
  }),
  dispatch => ({
    loadPostsList: bindActionCreators(loadPostsList, dispatch),
    viewPostsById: bindActionCreators(viewPostsById, dispatch)
  })
)
@CSSModules(styles)
export class PostsDetail extends React.Component {

  // 服务端渲染
  // 加载需要在服务端渲染的数据
  static loadData({ store, match }) {
    return new Promise(async (resolve, reject) => {

      const { id } = match.params;

      const [ err, data ] = await loadPostsList({
        id: id,
        filters: {
          variables: {
            _id: id,
            deleted: false
            // weaken: false
          }
        }
      })(store.dispatch, store.getState);

      // 没有找到帖子，设置页面 http code 为404
      if (err || data.length == 0) {
        resolve({ code:404 });
      } else {
        resolve({ code:200 });
      }

    })
  }

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    // 服务端渲染，404内容显示处理
    const { list, notFoundPgae } = this.props;
    if (list && list.data && !list.data[0]) {
      notFoundPgae('该帖子不存在')
    }
  }

  async componentDidMount() {

    const { id } = this.props.match.params;
    const { list, loadPostsList, viewPostsById } = this.props;

    if (!list || !list.data) {

      await loadPostsList({
        id,
        filters: {
          variables: {
            _id: id,
            deleted: false
            // weaken: false
          }
        }
      });

      this.componentWillMount();

    }

    viewPostsById({ id });

  }

  render() {

    const { list, isMember } = this.props;
    const { loading, data } = list || {};
    const posts = data && data[0] ? data[0] : null;

    if (loading || !posts) return (<Loading />);

    return(<div styleName="box">

      <Meta title={posts ? posts.title : '加载中...'} />

      {/*<div className="row">*/}

        {/*<div className="col-md-9">*/}

          <PostsDetailC id={posts._id} />

          {posts.comment_count > 0 ?
            <div className="card">
            <div className="card-header">{posts.comment_count}条评论</div>
            <div styleName="comment-list" className="card-body">
              <CommentList
                name={posts._id}
                filters={{
                  variables: {
                    posts_id: posts._id,
                    parent_id: 'not-exists',
                    page_size:10
                  }
                }}
                />
            </div>
            </div>
            : null}

          {isMember ?
            <div styleName="editor-comment">
              <EditorComment posts_id={posts._id} />
            </div>
            : null}



        {/*
        <div className="col-md-3">
          {posts && posts.topic_id && posts.topic_id._id ?
            <Sidebar
              recommendPostsDom={(<PostsList
                id={`sidebar-${posts._id}`}
                itemName="posts-item-title"
                // showPagination={false}
                filters={{
                  variables: {
                    sort_by: "comment_count,like_count,create_at",
                    deleted: false,
                    weaken: false,
                    page_size: 10,
                    topic_id: posts.topic_id._id,
                    start_create_at: (new Date().getTime() - 1000 * 60 * 60 * 24 * 7)+''
                  }
                }}
                />)}
              />
            : null}
        </div>
        */}

      {/*</div>*/}
      {/*</div>*/}

    </div>)
  }

}

export default Shell(PostsDetail);
