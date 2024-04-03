const { Game, Question, Pool, Slide, SocialLink } = require('../../db/models/User.model')

class GameController {

  async addGame(req, res, next) {
    try {
      let { quizNameInEnglish, quizNameInHindi, entranceAmount, startDateTime, noOfQuestion, noOfParticipation, noOfPrice, pricePool, questionArray, duration, poolSetting } = req.body;
      console.log("startDateTime====",startDateTime)
      if (poolPattern(poolSetting, pricePool) === false) {
        return res.error({}, 'Set mis match.');
      }

      const game = new Game({
        gameNameInHindi: quizNameInHindi,
        gameNameInEnglish: quizNameInEnglish,
        startedAt: startDateTime,
      //  endedAt: Date.now(endDateTime),
        entranceAmount,
        noOfQuestion,
        noOfParticipation,
        noOfPrice,
        pricePool,
        duration,
        isCompleted: false,
        schedule: startDateTime
      })

      const gameDetail = await game.save();

      let _contestPool = new Pool({
        gameId: gameDetail?._id,
        pool: poolSetting
      });
      await _contestPool.save();

      for (let i = 0; i < questionArray.length; i++) {
        const item = questionArray[i]
        const question = new Question({
          gameId: gameDetail?._id,
          q_no:i+1,
          questionInEnglish: item.questionInEnglish,
          questionInHindi: item.questionInHindi,
          optionsInEnglish: [
            { id: 1, answer: item.option1Eng },
            { id: 2, answer: item.option2Eng },
            { id: 3, answer: item.option3Eng },
            { id: 4, answer: item.option4Eng }
          ],
          optionsInHindi: [
            { id: 1, answer: item.option1Hin },
            { id: 2, answer: item.option2Hin },
            { id: 3, answer: item.option3Hin },
            { id: 4, answer: item.option4Hin }
          ],
          answer: item.answer
        })

        await question.save();
      }


      return res.success({ game }, 'Quiz added successfully');

    } catch (err) {
      console.error(err);
      return next(err);

    }
  }

  async addSlide(req, res, next) {
    try {
      const { name, slide } = req.body;

      let _slide = new Slide({
        name,
        slide
      });
      await _slide.save();
      return res.success({}, 'Slide add successfully.')
    } catch (err) {
      return next(err);
    }
  }

  async slideList(req, res, next) {
    try {
      let allSlide = await Slide.find({}, { name: 1, slide: 1, createdAt: 1 }).lean();
      return res.success({ allSlide }, 'Slides fetch successfully.')
    } catch (err) {
      return next(err);
    }
  }

  async addSocialLink(req, res, next) {
    try {
      const { name, link } = req.body;

      let _slide = new SocialLink({
        name,
        link
      });
      await _slide.save();
      return res.success({}, 'Social link add successfully.')
    } catch (err) {
      return next(err);
    }
  }

  async socialLinkList(req, res, next) {
    try {
      let page = ((req?.query?.page || 0) == 0) ? 0 : parseInt(req.query.page - 1);
      const PAGE_SIZE = req?.query?._limit || 10; // , 'name email mobile id '
      const allLink = await SocialLink.find({}, { name: 1, link: 1, createdAt: 1 }).sort({ createdAt: -1 }).skip(+PAGE_SIZE * +page).limit(+PAGE_SIZE)
      const total = await SocialLink.countDocuments({})
      return res.success({ totalPages: Math.ceil(total / PAGE_SIZE), allLink }, 'Social link fetch successfully.')
    } catch (err) {
      return next(err);
    }
  }

}

module.exports = new GameController()

function poolPattern(data, t) {
  const fromSet = new Set();
  const toSet = new Set();
  let previousTo = null;
  let _amount = 0;

  for (let i = 0; i < data.length; i++) {
    let { from, to, amount } = data[i];
    [from, to, amount] = [Number(from || 0), Number(to || 0), Number(amount || 0)]
    _amount = _amount + amount * (to - from + 1);
    if (
      fromSet.has(to) ||
      toSet.has(from) ||
      (from === to && fromSet.has(from)) ||
      _amount > t ||
      (previousTo !== null && Math.abs(previousTo - from) > 1) ||
      from > to
    ) {
      return false;
    }
    fromSet.add(from);
    toSet.add(to);
    previousTo = to;
  }
  return true;
}