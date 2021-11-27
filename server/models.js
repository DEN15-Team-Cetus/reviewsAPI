const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: 'matthewdowell',
  host: 'localhost',
  database: 'reviews',
  password: process.env.DB_PASSWORD,
  port: 5432,
})

client.connect()


const getReviews = (req, callback) => {
  var { page, count, sort, product_id } = req.query;
  var sortby = 'date';
  if (sort === 'newest') { sortby = 'date'; };
  if (sort === 'helpful') { sortby = 'helpfulness'; };
  if (sort === 'relevant') { sortby = 'helpfulness'; };
  count = count || 5;
  page = page || 1;
  const offset = page * count - count;
  var queryStr = `SELECT *, 
                   (
                    SELECT 
                      coalesce (json_agg(json_build_object('id', id, 'url', url)), '[]'::json) 
                    AS Photos FROM reviews_photos WHERE review_id = reviews.review_id                  
                   ) 
                 FROM reviews WHERE product_id = $1
                 ORDER BY ${sortby} DESC
                 OFFSET $2
                 LIMIT $3`;
  client.query(queryStr, [product_id, offset, count], (err, results) => {
    callback(err, results);
  })
}

const getMetaData = ({ product_id }, callback) => {
  var queryStr = `SELECT json_build_object(
                    'product_id', CAST (${product_id} AS TEXT), 
                    'ratings', 
                    (SELECT json_object_agg(rating, CAST(count AS TEXT)) FROM ratings WHERE product_id = $1),
                    'recommended',
                    (SELECT json_object_agg(recommend, CAST(count AS TEXT)) FROM recommended WHERE product_id = $1),
                    'characteristics',
                    (SELECT json_object_agg(name, json_build_object('id', id, 'value', CAST(value AS TEXT))) FROM agg_char_table WHERE product_id = $1)
                  )`;
  client
    .query(queryStr, [product_id])
    .then(res => { callback(null, res); })
    .catch(err => { callback(err); })
}

const postReview = (req, callback) => {
  console.log('post request: ', req);
  let { product_id, rating, summary, body, recommend, name, email, photos, characteristics } = req;
  console.log('photos: ', JSON.stringify(photos).split('\"').join('\''))
  photos = JSON.stringify(photos).split('\"').join('\'');
  var queryStr = `INSERT INTO reviews (
                    product_id,
                    rating,
                    date,
                    summary,
                    body,
                    recommend,
                    reviewer_name,
                    reviewer_email
                  )
                  VALUES (
                    $1, $2, (select round( date_part( 'epoch', now() ) ) * 1000), $3, $4, $5, $6, $7
                  )`;
  client
    .query(queryStr, [product_id, rating, summary, body, recommend, name, email]);
  client
    .query(`INSERT INTO reviews_photos (review_id, url) 
    VALUES ((SELECT (MAX("review_id")) FROM "reviews"), UNNEST(ARRAY${photos}))`)
    .then(res => { callback(null, res); })
    .catch(err => { callback(err); })
}

const markReviewAsHelpful = (callback) => {

}

const reportReview = (callback) => {

}

module.exports = {
  getReviews,
  getMetaData,
  postReview,
  markReviewAsHelpful,
  reportReview
}

